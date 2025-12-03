import { format } from "date-fns";
import { useFormik } from "formik";
import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarDays,
  Calendar as CalendarIcon,
  CheckSquare,
  DollarSign,
  FileText,
  Filter,
  Folder,
  GitBranch,
  Grid3X3,
  List,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  Search,
  Settings,
  Target,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Progress } from "../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";
import { useProjectMasters } from "../../hooks/useProjectMasters";
import { useProjectOwners } from "../../hooks/useProjectOwners";
import { Project } from "../../mock-data/projects";
import { Customer, customerApiService } from "../../services/customerApi";
import { CreateProjectRequest } from "../../services/projectApi";
import { User, userApiService } from "../../services/userApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  clearError,
  createProject,
  fetchProjects,
  setFilters,
} from "../../store/slices/projectSlice";
import { ProjectTemplates } from "./ProjectTemplates";
import { TaskManagement } from "./TaskManagement";

import { Capitalize } from "../../utils/textTransform";

// Add computed properties for UI display
const addComputedProperties = (project: Project) => ({
  ...project,
  teamSize: (project.teamMembers?.length || 0) + 1, // +1 for team lead
  tasksTotal: 25, // Default value, could be calculated from tasks
  tasksCompleted: Math.floor((project.progress / 100) * 25),
  issuesOpen: Math.floor(Math.random() * 5) + 1,
  upcomingMilestones: 2,
  recentActivity: project.lastUpdated,
  epics: Math.floor(Math.random() * 5) + 1,
  stories: Math.floor(Math.random() * 20) + 10,
  currentSprint: `Sprint ${Math.floor(Math.random() * 5) + 20}`,
  nextMilestone: "Release v1.0",
  milestoneDue: project.endDate,
  version: "v1.0.0",
  dependencies: [],
});

interface ProjectsProps {
  onProjectSelect?: (projectId: string) => void;
  user?: any;
}

export function Projects({ onProjectSelect, user }: ProjectsProps) {
  const dispatch = useAppDispatch();
  const {
    projects: reduxProjects,
    loading,
    error,
    filters,
    total,
  } = useAppSelector((state) => state.projects);

  const {
    data: projectMasters,
    loading: mastersLoading,
    error: mastersError,
    retry: retryMasters,
  } = useProjectMasters();

  const {
    data: projectOwners,
    loading: ownersLoading,
    error: ownersError,
    retry: retryOwners,
  } = useProjectOwners();

  // Team members state management
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);

  // Customer state management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const userRole = user?.role || "developer";
  const isAdmin = userRole === "admin";
  const isProjectManager = userRole === "project_manager";
  const isDeveloperOrTester = userRole === "developer" || userRole === "tester";

  // Add computed properties to projects from Redux
  const projects = reduxProjects.map(addComputedProperties);

  // Filter projects based on user role
  const getFilteredProjects = () => {
    if (isAdmin || isProjectManager) {
      return projects; // Admins and PMs see all projects
    } else if (isDeveloperOrTester) {
      // Developers and testers only see projects they're assigned to
      // Check if user ID is in team_members array or if user is the team_lead_id
      // Note: API uses snake_case (team_members, team_lead_id) while mock uses camelCase (teamMembers, teamLead)
      // Check both formats for compatibility
      return projects.filter((project) => {
        const projectAny = project as any;
        const teamMembers =
          projectAny.team_members || projectAny.teamMembers || [];
        const teamLeadId = projectAny.team_lead_id || projectAny.teamLeadId;

        return teamMembers.includes(user?.id) || teamLeadId === user?.id;
      });
    }
    return projects;
  };

  const roleFilteredProjects = getFilteredProjects();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState({
    status: "all",
    priority: "all",
    methodology: "all",
    type: "all",
  });
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "",
    priority: "",
    methodology: "",
    type: "",
    startDate: new Date(),
    dueDate: new Date(),
    budget: 0,
    customer: "",
    owner: "",
    team: [] as any[],
    isPublic: true,
    notifications: true,
    autoArchive: false,
    version: "",
    tags: [] as string[],
    customFields: {} as Record<string, any>,
    customerId: "",
    teamLead: "",
    prefix: "",
  });

  // Update default values when API data is loaded
  useEffect(() => {
    if (projectMasters) {
      const availableStatuses = getApiStatuses();
      const availablePriorities = getApiPriorities();

      // Only update if current values don't exist in available options
      if (
        availableStatuses.length > 0 &&
        !availableStatuses.find((s) => s.value === newProject.status)
      ) {
        setNewProject((prev) => ({
          ...prev,
          status: availableStatuses[0].value,
        }));
      }

      if (
        availablePriorities.length > 0 &&
        !availablePriorities.find((p) => p.value === newProject.priority)
      ) {
        const mediumPriority = availablePriorities.find(
          (p) => p.value === "Medium"
        );
        setNewProject((prev) => ({
          ...prev,
          priority: mediumPriority?.value || availablePriorities[0].value,
        }));
      }
    }
  }, [projectMasters]);

  const [activeTab, setActiveTab] = useState("general");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Formik validation schema
  const projectValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Project name is required")
      .min(3, "Project name must be at least 3 characters")
      .max(100, "Project name must be at most 100 characters"),
    description: Yup.string().optional(),
    customer: Yup.string().required("Customer is required"),
    prefix: Yup.string()
      .required("Project prefix is required")
      .min(2, "Prefix must be at least 2 characters")
      .max(10, "Prefix must be at most 10 characters")
      .matches(
        /^[A-Z0-9]+$/,
        "Prefix must contain only uppercase letters and numbers"
      ),
    status: Yup.string().required("Status is required"),
    priority: Yup.string().required("Priority is required"),
    methodology: Yup.string().required("Methodology is required"),
    type: Yup.string().required("Project type is required"),
    owner: Yup.string().required("Project owner is required"),
    startDate: Yup.date().required("Start date is required"),
    dueDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date must be after start date"),
    budget: Yup.number().min(0, "Budget must be a positive number"),
  });

  // Initialize Formik
  const formik = useFormik({
    initialValues: newProject,
    validationSchema: projectValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await handleCreateProjectSubmit(values);
    },
  });

  // Helper functions to process API data
  const getApiStatuses = () => {
    if (!projectMasters?.statuses) return [];
    return projectMasters.statuses
      .filter((status) => status.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((status) => ({
        value: status.name,
        color: `bg-[${status.color}] text-white`,
      }));
  };

  const getApiPriorities = () => {
    if (!projectMasters?.priorities) return [];
    return projectMasters.priorities
      .filter((priority) => priority.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((priority) => ({
        value: priority.name,
        color: `bg-[${priority.color}] text-white`,
      }));
  };

  const getApiMethodologies = () => {
    if (!projectMasters?.methodologies) return [];
    return projectMasters.methodologies
      .filter((methodology) => methodology.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((methodology) => methodology.name);
  };

  const getApiProjectTypes = () => {
    if (!projectMasters?.types) return [];
    return projectMasters.types
      .filter((type) => type.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((type) => type.name);
  };

  // Use API data if available, fallback to mock data
  const statuses = getApiStatuses().length > 0 ? getApiStatuses() : [];

  const priorities = getApiPriorities().length > 0 ? getApiPriorities() : [];
  console.log("priorities: ", priorities);

  const editableMethodologies =
    getApiMethodologies().length > 0 ? getApiMethodologies() : [];

  const editableProjectTypes =
    getApiProjectTypes().length > 0 ? getApiProjectTypes() : [];

  // Fetch projects on component mount
  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  // Update filters in Redux when local filters change
  useEffect(() => {
    dispatch(
      setFilters({
        search: searchQuery,
        status: filterBy.status === "all" ? "" : filterBy.status,
        priority: filterBy.priority === "all" ? "" : filterBy.priority,
        methodology: filterBy.methodology === "all" ? "" : filterBy.methodology,
        projectType: filterBy.type === "all" ? "" : filterBy.type,
      })
    );
  }, [dispatch, searchQuery, filterBy]);

  // Load customers from API
  const loadCustomers = async () => {
    setLoadingCustomers(true);
    setCustomersError(null);
    try {
      const response = await customerApiService.getCustomers({ size: 100 }); // Get all customers
      setCustomers(response.customers || []);
    } catch (error) {
      setCustomersError("Failed to load customers");
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load team members from API
  const loadTeamMembers = async () => {
    setLoadingTeamMembers(true);
    setTeamMembersError(null);
    try {
      const response = await userApiService.getTeamMembers({
        per_page: 100,
        is_active: true,
      });
      setTeamMembers(response.items || []);
    } catch (error) {
      setTeamMembersError("Failed to load team members");
      console.error("Team members loading error:", error);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Load team members on component mount
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-[#28A745]";
      case "In Progress":
        return "text-[#FFC107]";
      case "Completed":
        return "text-[#007BFF]";
      case "On Hold":
        return "text-[#DC3545]";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredProjects = roleFilteredProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterBy.status === "all" || project.status === filterBy.status;
    const matchesPriority =
      filterBy.priority === "all" || project.priority === filterBy.priority;
    const matchesMethodology =
      filterBy.methodology === "all" ||
      project.methodology === filterBy.methodology;
    const matchesType =
      filterBy.type === "all" || project.projectType === filterBy.type;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesMethodology &&
      matchesType
    );
  });
  console.log(filteredProjects, "filteredProjects");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-[#491280] text-white";
      case "High":
        return "bg-[#DC3545] text-white";
      case "Medium":
        return "bg-[#FFC107] text-white";
      case "Low":
        return "bg-[#6C757D] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 90)
      return { color: "text-[#DC3545]", status: "Over Budget" };
    if (percentage > 75) return { color: "text-[#FFC107]", status: "At Risk" };
    return { color: "text-[#28A745]", status: "On Track" };
  };

  const handleInputChange = (field: string, value: any) => {
    formik.setFieldValue(field, value);
    setNewProject((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTeamMember = (member: any) => {
    if (!formik.values.team.find((m) => m.id === member.id)) {
      const updatedTeam = [...formik.values.team, member];
      formik.setFieldValue("team", updatedTeam);
      setNewProject((prev) => ({
        ...prev,
        team: updatedTeam,
      }));
    }
  };

  const handleRemoveTeamMember = (memberId: number) => {
    const updatedTeam = formik.values.team.filter((m) => m.id !== memberId);
    formik.setFieldValue("team", updatedTeam);
    setNewProject((prev) => ({
      ...prev,
      team: updatedTeam,
    }));
  };

  const handleAddTag = () => {
    const tagToAdd = newTag.trim();
    if (tagToAdd && !formik.values.tags.includes(tagToAdd)) {
      const updatedTags = [...formik.values.tags, tagToAdd];
      formik.setFieldValue("tags", updatedTags);
      setNewProject((prev) => ({
        ...prev,
        tags: updatedTags,
      }));
      setNewTag("");
    } else if (tagToAdd && formik.values.tags.includes(tagToAdd)) {
      toast.error("Tag already exists");
    } else if (!tagToAdd) {
      toast.error("Please enter a tag name");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = formik.values.tags.filter((t) => t !== tag);
    formik.setFieldValue("tags", updatedTags);
    setNewProject((prev) => ({
      ...prev,
      tags: updatedTags,
    }));
  };

  const handleCreateProjectSubmit = async (values: typeof newProject) => {
    setIsLoading(true);

    try {
      // Find customer ID from the selected customer name
      const selectedCustomer = customers.find(
        (c) => c.name === values.customer
      );

      // Find team lead ID from the selected owner name
      const selectedOwner = projectOwners?.items?.find(
        (owner) => owner.name === values.owner
      );

      const projectData: CreateProjectRequest = {
        name: values.name,
        description: values.description,
        status: values.status,
        start_date: values.startDate.toISOString().split("T")[0],
        end_date: values.dueDate.toISOString().split("T")[0],
        budget: values.budget,
        customer_id:
          selectedCustomer?.id || values.customerId || "default-customer",
        customer: values.customer,
        priority: values.priority,
        team_lead_id:
          selectedOwner?.id ||
          values.teamLead ||
          values.owner ||
          "default-lead",
        team_members: values.team.map((member) => {
          // Try to find the member ID from the team members data
          const teamMember = teamMembers.find((tm) => tm.name === member.name);
          if (teamMember?.id) {
            return teamMember.id;
          }
          // Return the member's existing ID or generate a fallback
          return member.id || `member-${Date.now()}`;
        }),
        tags: values.tags,
        methodology: values.methodology,
        project_type: values.type,
        color: "#007BFF", // Default project color
        prefix: values.prefix,
        permissions: {
          public_project: false,
          guest_access: false,
          time_tracking: true,
          file_sharing: true,
          task_creation: true
        },
        notifications: {
          task_updates: true,
          file_uploads: true,
          comments: true,
          mentions: true,
          deadlines: true,
          status_changes: true
        }
      };

      await dispatch(createProject(projectData)).unwrap();
      toast.success("Project created successfully!");
      setShowCreateProject(false);

      // Reset form to initial state with proper default values
      const availableStatuses = getApiStatuses();
      const availablePriorities = getApiPriorities();

      const initialValues = {
        name: "",
        description: "",
        status: availableStatuses.length > 0 ? availableStatuses[0].value : "",
        priority:
          availablePriorities.length > 0
            ? availablePriorities.find((p) => p.value === "Medium")?.value ||
            availablePriorities[0].value
            : "",
        methodology: "",
        type: "",
        startDate: new Date(),
        dueDate: new Date(),
        budget: 0,
        customer: "",
        owner: "",
        team: [] as any[],
        isPublic: true,
        notifications: true,
        autoArchive: false,
        version: "",
        tags: [] as string[],
        customFields: {} as Record<string, any>,
        customerId: "",
        teamLead: "",
        prefix: "",
      };

      setNewProject(initialValues);
      formik.resetForm({ values: initialValues });
      setActiveTab("general");
    } catch (error) {
      toast.error(`Failed to create project: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: any) => {
    setNewProject({
      ...newProject,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      methodology: template.methodology,
      type: template.type,
    });
    setShowTemplateModal(false);
    setShowCreateProject(true);
  };

  // Get available team members from API data
  const getAvailableMembers = () => {
    const availableTeamMembers =
      teamMembers.filter((member) => member.is_active) || [];

    // Use team members API data
    const allMembers = availableTeamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      role: typeof member.role === "object" ? member.role.name : member.role,
      avatar: member.user_profile || member.name.charAt(0).toUpperCase(),
      email: member.email,
      department: member.department,
    }));

    return allMembers.filter(
      (availableMember) =>
        !newProject.team.find(
          (teamMember) => teamMember.id === availableMember.id
        )
    );
  };

  const availableMembers = getAvailableMembers();

  const getMethodologyIcon = (methodology: string) => {
    switch (methodology) {
      case "Scrum":
        return <Zap className="w-4 h-4" />;
      case "Kanban":
        return <BarChart3 className="w-4 h-4" />;
      case "Waterfall":
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Show error if there's one
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Show error for masters API
  useEffect(() => {
    if (mastersError) {
      toast.error(`Failed to load project configuration: ${mastersError}`);
    }
  }, [mastersError]);

  // Show error for owners API
  useEffect(() => {
    if (ownersError) {
      toast.error(`Failed to load project owners: ${ownersError}`);
    }
  }, [ownersError]);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isAdmin
              ? "All Projects"
              : isProjectManager
                ? "Managed Projects"
                : "My Projects"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "End-to-end project lifecycle management with Agile, Waterfall & Hybrid workflows"
              : isProjectManager
                ? "Projects under your management and team collaboration"
                : "Your assigned projects and contributions"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filter Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Filter Projects</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Status
                    </label>
                    <Select
                      value={filterBy.status}
                      onValueChange={(value: string) =>
                        setFilterBy({ ...filterBy, status: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Priority
                    </label>
                    <Select
                      value={filterBy.priority}
                      onValueChange={(value: string) =>
                        setFilterBy({ ...filterBy, priority: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Methodology
                    </label>
                    <Select
                      value={filterBy.methodology}
                      onValueChange={(value: string) =>
                        setFilterBy({ ...filterBy, methodology: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="Scrum">Scrum</SelectItem>
                        <SelectItem value="Kanban">Kanban</SelectItem>
                        <SelectItem value="Waterfall">Waterfall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Type
                    </label>
                    <Select
                      value={filterBy.type}
                      onValueChange={(value: string) =>
                        setFilterBy({ ...filterBy, type: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Software Development">
                          Software Dev
                        </SelectItem>
                        <SelectItem value="Infrastructure">
                          Infrastructure
                        </SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Analytics">Analytics</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setFilterBy({
                      status: "all",
                      priority: "all",
                      methodology: "all",
                      type: "all",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            size="sm"
            className="bg-[#28A745] hover:bg-[#218838] text-white"
            onClick={() => setShowCreateProject(true)}
            disabled={mastersLoading || ownersLoading || loadingTeamMembers}
          >
            <Plus className="w-4 h-4 mr-2" />
            {mastersLoading || ownersLoading || loadingTeamMembers
              ? "Loading..."
              : "New Project"}
          </Button>
        </div>
      </div>

      {/* Project Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Projects
              </p>
              <p className="text-3xl font-bold">
                {roleFilteredProjects.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{Math.floor(roleFilteredProjects.length * 0.1)} from last month
              </p>
            </div>
            <div className="p-3 bg-[#007BFF]/10 rounded-full">
              <Folder className="w-6 h-6 text-[#007BFF]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Projects
              </p>
              <p className="text-3xl font-bold">
                {
                  roleFilteredProjects.filter((p) => p.status === "Active")
                    .length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in progress
              </p>
            </div>
            <div className="p-3 bg-[#28A745]/10 rounded-full">
              <PlayCircle className="w-6 h-6 text-[#28A745]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                At Risk
              </p>
              <p className="text-3xl font-bold">
                {
                  roleFilteredProjects.filter((p) => {
                    const budgetUsage = (p.spent / p.budget) * 100;
                    return budgetUsage > 90 || p.progress < 50;
                  }).length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </div>
            <div className="p-3 bg-[#FFC107]/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-[#FFC107]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                On Hold
              </p>
              <p className="text-3xl font-bold">
                {
                  roleFilteredProjects.filter((p) => p.status === "On Hold")
                    .length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Temporarily paused
              </p>
            </div>
            <div className="p-3 bg-[#DC3545]/10 rounded-full">
              <PauseCircle className="w-6 h-6 text-[#DC3545]" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle and Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">
              Projects ({filteredProjects.length})
            </h3>
            <Badge variant="outline" className="ml-2">
              {viewMode === "grid" ? "Card View" : "Table View"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid" ? "bg-[#007BFF] hover:bg-[#0056b3]" : ""
              }
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list" ? "bg-[#007BFF] hover:bg-[#0056b3]" : ""
              }
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Card View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredProjects.map((project) => {
              const budgetStatus = getBudgetStatus(
                project.spent,
                project.budget
              );
              console.log(project, "akuhkdhaksjd");

              return (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onProjectSelect?.(project.id)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-[#007BFF] transition-colors">
                            {project.name}
                          </h3>
                          <Badge
                            className={getPriorityColor(
                              Capitalize(project.priority)
                            )}
                          >
                            {Capitalize(project.priority)}
                          </Badge>
                        </div>
                        {/* <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {project.description}
                        </p> */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            {getMethodologyIcon(project.methodology)}
                            <span>{project.methodology}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.project_type || "-"}
                          </Badge>
                          <span
                            className={`text-xs font-medium ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedProjectForTasks(project.id);
                            setShowTaskManagement(true);
                          }}
                          title="Manage Tasks"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Epics
                        </p>
                        <p className="text-lg font-bold">{project.epics}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Stories
                        </p>
                        <p className="text-lg font-bold">{project.stories}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Tasks
                        </p>
                        <p className="text-lg font-bold">
                          {project.tasksCompleted}/{project.tasksTotal}
                        </p>
                      </div>
                    </div>

                    {/* Team and Budget */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {project.teamSize} members
                        </span>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${budgetStatus.color}`}
                        >
                          ${(project.spent / 1000).toFixed(0)}k / $
                          {(project.budget / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {budgetStatus.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === "list" && (
          <Card className="overflow-x-auto relative">
            <Table className="min-w-full relative border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Methodology</TableHead>
                  <TableHead>Due Date</TableHead>

                  {/* Sticky last column */}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredProjects.map((project) => {
                  const budgetStatus = getBudgetStatus(
                    project.spent,
                    project.budget
                  );

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-semibold text-sm">
                            {project.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {project.customer}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(project.status)}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{project.teamSize}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div
                            className={`text-sm font-medium ${budgetStatus.color}`}
                          >
                            ${(project.spent / 1000).toFixed(0)}k / $
                            {(project.budget / 1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {budgetStatus.status}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getMethodologyIcon(project.methodology)}
                          <span className="text-sm">{project.methodology}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {project.endDate || "N/A"}
                        </div>
                      </TableCell>

                      {/* Sticky action buttons */}
                      <TableCell className="sticky right-0  z-10">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setSelectedProjectForTasks(project.id);
                              setShowTaskManagement(true);
                            }}
                            title="Manage Tasks"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Project Template Modal - 1200px width */}
      <ProjectTemplates
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleUseTemplate}
      />

      {/* Create Project Dialog - Enhanced with tabs like edit modal */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="w-[1200px] max-w-[1200px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Project</span>
            </DialogTitle>
            <DialogDescription>
              Set up your project with comprehensive details, manage team
              members, set timeline and budget, and configure project settings.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="general"
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Team</span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex items-center space-x-2"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Timeline & Budget</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      onBlur={formik.handleBlur}
                      placeholder="Enter project name"
                      className={cn(
                        "mt-1",
                        formik.touched.name &&
                        formik.errors.name &&
                        "border-red-500"
                      )}
                    />
                    {formik.touched.name && formik.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Enter project description"
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select
                      value={newProject.customer}
                      onValueChange={(value: string) => {
                        handleInputChange("customer", value);
                        formik.setFieldTouched("customer", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.customer &&
                          formik.errors.customer &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue
                          placeholder={
                            loadingCustomers
                              ? "Loading customers..."
                              : "Select customer"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCustomers ? (
                          <SelectItem value="loading" disabled>
                            Loading customers...
                          </SelectItem>
                        ) : customersError ? (
                          <SelectItem value="error" disabled>
                            Error loading customers
                          </SelectItem>
                        ) : customers.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No customers available
                          </SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.name}>
                              <div className="flex items-center space-x-2">
                                <span>{customer.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {customer.industry}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    color:
                                      customer.status === "Active"
                                        ? "#28A745"
                                        : "#6C757D",
                                  }}
                                >
                                  {customer.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formik.touched.customer && formik.errors.customer && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.customer}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newProject.version}
                      onChange={(e) =>
                        handleInputChange("version", e.target.value)
                      }
                      placeholder="e.g., v1.0.0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prefix">Project Prefix *</Label>
                    <Input
                      id="prefix"
                      value={newProject.prefix}
                      onChange={(e) =>
                        handleInputChange(
                          "prefix",
                          e.target.value.toUpperCase()
                        )
                      }
                      onBlur={formik.handleBlur}
                      placeholder="e.g., PROJ"
                      className={cn(
                        "mt-1",
                        formik.touched.prefix &&
                        formik.errors.prefix &&
                        "border-red-500"
                      )}
                    />
                    {formik.touched.prefix && formik.errors.prefix && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.prefix}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={newProject.status}
                      onValueChange={(value: string) => {
                        handleInputChange("status", value);
                        formik.setFieldTouched("status", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.status &&
                          formik.errors.status &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${status.color.split(" ")[0]
                                  }`}
                              />
                              <span>{status.value}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.status && formik.errors.status && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.status}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={newProject.priority}
                      onValueChange={(value: string) => {
                        handleInputChange("priority", value);
                        formik.setFieldTouched("priority", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.priority &&
                          formik.errors.priority &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${priority.color.split(" ")[0]
                                  }`}
                              />
                              <span>{priority.value}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.priority && formik.errors.priority && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.priority}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="methodology">Methodology *</Label>
                    <Select
                      value={newProject.methodology}
                      onValueChange={(value: string) => {
                        handleInputChange("methodology", value);
                        formik.setFieldTouched("methodology", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.methodology &&
                          formik.errors.methodology &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Select methodology" />
                      </SelectTrigger>
                      <SelectContent>
                        {editableMethodologies.map((methodology) => (
                          <SelectItem key={methodology} value={methodology}>
                            {methodology}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.methodology &&
                      formik.errors.methodology && (
                        <p className="text-sm text-red-500 mt-1">
                          {formik.errors.methodology}
                        </p>
                      )}
                  </div>

                  <div>
                    <Label htmlFor="type">Project Type *</Label>
                    <Select
                      value={newProject.type}
                      onValueChange={(value: string) => {
                        handleInputChange("type", value);
                        formik.setFieldTouched("type", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.type &&
                          formik.errors.type &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {editableProjectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.type && formik.errors.type && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.type}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="owner">Project Owner *</Label>
                    <Select
                      value={newProject.owner}
                      onValueChange={(value: string) => {
                        handleInputChange("owner", value);
                        formik.setFieldTouched("owner", true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1",
                          formik.touched.owner &&
                          formik.errors.owner &&
                          "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Select project owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownersLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading owners...
                          </SelectItem>
                        ) : projectOwners?.items?.length ? (
                          projectOwners.items
                            .filter((owner) => owner.is_active)
                            .map((owner) => (
                              <SelectItem key={owner.id} value={owner.name}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-[#007BFF] text-white text-xs flex items-center justify-center">
                                    {owner.avatar ||
                                      owner.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      {owner.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {typeof owner.role === "object"
                                        ? owner.role.name
                                        : owner.role}{" "}
                                      • {owner.department}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-owners" disabled>
                            No owners available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {formik.touched.owner && formik.errors.owner && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik.errors.owner}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {newProject.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                    disabled={!newTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-medium mb-4 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Current Team ({newProject.team.length})</span>
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {newProject.team.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No team members assigned
                      </p>
                    ) : (
                      newProject.team.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-[#007BFF] text-white text-sm">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.role}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeamMember(member.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-4 flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Available Team Members</span>
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loadingTeamMembers ? (
                      <p className="text-muted-foreground text-sm">
                        Loading team members...
                      </p>
                    ) : teamMembersError ? (
                      <div className="text-center py-4">
                        <p className="text-red-500 text-sm">
                          {teamMembersError}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadTeamMembers}
                          className="mt-2"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : availableMembers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        All team members are already assigned
                      </p>
                    ) : (
                      availableMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-[#28A745] text-white text-sm">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.role}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.department}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTeamMember(member)}
                            className="text-[#28A745] hover:text-[#28A745] hover:bg-[#28A745]/10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-medium mb-4 flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>Timeline</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Start Date *</Label>
                      <Popover
                        open={showStartDatePicker}
                        onOpenChange={setShowStartDatePicker}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !newProject.startDate && "text-muted-foreground",
                              formik.touched.startDate &&
                              formik.errors.startDate &&
                              "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newProject.startDate
                              ? format(newProject.startDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newProject.startDate}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                handleInputChange("startDate", date);
                                formik.setFieldTouched("startDate", true);
                                setShowStartDatePicker(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {formik.touched.startDate && formik.errors.startDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {formik.errors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>End Date *</Label>
                      <Popover
                        open={showDueDatePicker}
                        onOpenChange={setShowDueDatePicker}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !newProject.dueDate && "text-muted-foreground",
                              formik.touched.dueDate &&
                              formik.errors.dueDate &&
                              "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newProject.dueDate
                              ? format(newProject.dueDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newProject.dueDate}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                handleInputChange("dueDate", date);
                                formik.setFieldTouched("dueDate", true);
                                setShowDueDatePicker(false);
                              }
                            }}
                            initialFocus
                            disabled={(date: Date) =>
                              date <= newProject.startDate
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {formik.touched.dueDate && formik.errors.dueDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {formik.errors.dueDate}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-muted-foreground">Duration</Label>
                      <p className="text-sm font-medium mt-1">
                        {Math.ceil(
                          (newProject.dueDate.getTime() -
                            newProject.startDate.getTime()) /
                          (1000 * 3600 * 24)
                        )}{" "}
                        days
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-4 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Budget</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="budget">Total Budget ($)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={newProject.budget}
                        onChange={(e) =>
                          handleInputChange(
                            "budget",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Enter budget amount"
                        className="mt-1"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Project Settings</span>
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Public Project</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow all team members to view this project
                      </p>
                    </div>
                    <Switch
                      checked={newProject.isPublic}
                      onCheckedChange={(checked: boolean) =>
                        handleInputChange("isPublic", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email updates for project activities
                      </p>
                    </div>
                    <Switch
                      checked={newProject.notifications}
                      onCheckedChange={(checked: boolean) =>
                        handleInputChange("notifications", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Auto Archive</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically archive completed projects after 30 days
                      </p>
                    </div>
                    <Switch
                      checked={newProject.autoArchive}
                      onCheckedChange={(checked: boolean) =>
                        handleInputChange("autoArchive", checked)
                      }
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateProject(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Mark all fields as touched to show validation errors
                formik.setTouched({
                  name: true,
                  customer: true,
                  prefix: true,
                  status: true,
                  priority: true,
                  methodology: true,
                  type: true,
                  owner: true,
                  startDate: true,
                  dueDate: true,
                });
                formik.handleSubmit();
              }}
              disabled={isLoading}
              className="bg-[#28A745] hover:bg-[#218838]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Management Modal */}
      {selectedProjectForTasks && (
        <TaskManagement
          projectId={selectedProjectForTasks}
          isOpen={showTaskManagement}
          onClose={() => {
            setShowTaskManagement(false);
            setSelectedProjectForTasks(null);
          }}
        />
      )}
    </div>
  );
}
