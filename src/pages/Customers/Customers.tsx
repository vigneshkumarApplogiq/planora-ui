import { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Building,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Link,
  Shield,
  Eye,
  Settings,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  Timer,
  Flag,
  ExternalLink,
  Users,
  Activity,
  Briefcase,
  MessageSquare,
  Edit,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { masterApiService, Industry } from "../../services/masterApi";
import {
  customerApiService,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListParams,
} from "../../services/customerApi";

// TODO: Integrate with actual customer project API
const customerProjects: any[] = [];

// TODO: Integrate with SLA metrics API
const slaMetrics: any[] = [];

// TODO: Integrate with activity feed API
const recentActivities: any[] = [];

interface CustomersProps {
  user?: any;
}

export function Customers({ user }: CustomersProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [selectedClientView, setSelectedClientView] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<
    (typeof customers)[0] | null
  >(null);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState<"create" | "edit">(
    "create"
  );
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    industry: "",
    contactName: "",
    contactTitle: "",
    email: "",
    phone: "",
    website: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    priority: "Medium",
    notes: "",
  });

  // Load customers from API
  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: CustomerListParams = {
        page: currentPage,
        size: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        industry: industryFilter !== "All" ? industryFilter : undefined,
        priority: priorityFilter !== "All" ? priorityFilter : undefined,
      };

      const response = await customerApiService.getCustomers(params);

      // Add defensive checks for API response
      if (response && response.customers && Array.isArray(response.customers)) {
        setCustomers(response.customers);
        setTotalCustomers(response.total || 0);
        setHasNextPage(response.has_next || false);
        setHasPrevPage(response.has_prev || false);
      } else {
        console.warn("Unexpected API response format:", response);
        setCustomers([]);
        setTotalCustomers(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      }
    } catch (error) {
      setError("Failed to load customers");
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Load industries on component mount
  useEffect(() => {
    const loadIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const industriesData = await masterApiService.getIndustries();
        setIndustries(industriesData);
      } catch (error) {
        toast.error("Failed to load industries");
      } finally {
        setLoadingIndustries(false);
      }
    };

    loadIndustries();
  }, []);

  // Load customers when component mounts or filters change
  useEffect(() => {
    loadCustomers();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    industryFilter,
    priorityFilter,
  ]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      toast.error("Customer name and email are required");
      return;
    }

    setSaving(true);
    try {
      const customerData: CreateCustomerRequest = {
        name: newCustomer.name,
        industry: newCustomer.industry,
        contact: {
          name: newCustomer.contactName,
          email: newCustomer.email,
          phone: newCustomer.phone,
          title: newCustomer.contactTitle,
        },
        website: newCustomer.website,
        address: {
          street: newCustomer.street,
          city: newCustomer.city,
          state: newCustomer.state,
          zip: newCustomer.zip,
          country: newCustomer.country,
        },
        status: "Active",
        total_revenue: 0,
        project_ids: [],
        priority: newCustomer.priority,
        notes: newCustomer.notes,
      };

      await customerApiService.createCustomer(customerData);
      toast.success("Customer created successfully!");
      setShowCustomerForm(false);
      resetNewCustomerForm();
      // Refresh customer list
      loadCustomers();
    } catch (error) {
      toast.error("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingCustomer ||
      !newCustomer.name.trim() ||
      !newCustomer.email.trim()
    ) {
      toast.error("Customer name and email are required");
      return;
    }

    setSaving(true);
    try {
      const customerData: UpdateCustomerRequest = {
        name: newCustomer.name,
        industry: newCustomer.industry,
        contact: {
          name: newCustomer.contactName,
          email: newCustomer.email,
          phone: newCustomer.phone,
          title: newCustomer.contactTitle,
        },
        website: newCustomer.website,
        address: {
          street: newCustomer.street,
          city: newCustomer.city,
          state: newCustomer.state,
          zip: newCustomer.zip,
          country: newCustomer.country,
        },
        priority: newCustomer.priority,
        notes: newCustomer.notes,
      };

      await customerApiService.updateCustomer(editingCustomer.id, customerData);
      toast.success("Customer updated successfully!");
      setShowCustomerForm(false);
      setEditingCustomer(null);
      resetNewCustomerForm();
      // TODO: Refresh customer list
    } catch (error) {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const resetNewCustomerForm = () => {
    setNewCustomer({
      name: "",
      industry: "",
      contactName: "",
      contactTitle: "",
      email: "",
      phone: "",
      website: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      priority: "Medium",
      notes: "",
    });
  };

  const openEditCustomer = (customer: (typeof customers)[0]) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      industry: customer.industry,
      contactName: customer.contact.name,
      contactTitle: customer.contact.title,
      email: customer.contact.email,
      phone: customer.contact.phone,
      website: customer.website,
      street: customer.address.street,
      city: customer.address.city,
      state: customer.address.state,
      zip: customer.address.zip,
      country: customer.address.country,
      priority: customer.priority,
      notes: (customer as any).notes || "",
    });
    setCustomerFormMode("edit");
    setActiveFormTab("basic");
    setShowCustomerForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-[#28A745] text-white";
      case "Inactive":
        return "bg-[#6C757D] text-white";
      case "Prospective":
        return "bg-[#007BFF] text-white";
      case "On Hold":
        return "bg-[#FFC107] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "text-[#28A745]";
      case "At Risk":
        return "text-[#FFC107]";
      case "Overdue":
        return "text-[#DC3545]";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-l-[#DC3545] bg-[#DC3545]/5";
      case "Medium":
        return "border-l-[#FFC107] bg-[#FFC107]/5";
      case "Low":
        return "border-l-[#28A745] bg-[#28A745]/5";
      default:
        return "border-l-muted bg-muted/5";
    }
  };

  // Pagination calculation - now handled by API
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCustomers);

  // Use customers directly from API (already filtered and paginated)
  const filteredCustomers = customers || [];

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, industryFilter, priorityFilter]);

  // Get unique values for filter dropdowns
  const uniqueStatuses = [
    "All",
    ...Array.from(
      new Set((customers || []).map((c) => c.status).filter(Boolean))
    ),
  ];
  const uniqueIndustries = [
    "All",
    ...Array.from(
      new Set([
        ...industries.map((i) => i.name),
        ...(customers || []).map((c) => c.industry).filter(Boolean),
      ])
    ),
  ];
  const uniquePriorities = [
    "All",
    ...Array.from(
      new Set((customers || []).map((c) => c.priority).filter(Boolean))
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && customers.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-current border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer</h1>
          <p className="text-muted-foreground">
            Lightweight CRM with client portal access & project transparency
          </p>
        </div>
        <div className="flex flex-col items-end space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Filter Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Filter Customers</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Priority
                      </label>
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniquePriorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-1 block">
                        Industry
                      </label>
                      <Select
                        value={industryFilter}
                        onValueChange={setIndustryFilter}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueIndustries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("All");
                      setIndustryFilter("All");
                      setPriorityFilter("All");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClientPortal(true)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Client Portal
            </Button>
          </div>

          <Button
            className="bg-[#28A745] hover:bg-[#218838] text-white"
            onClick={() => {
              setCustomerFormMode("create");
              setActiveFormTab("basic");
              resetNewCustomerForm();
              setShowCustomerForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Associations</TabsTrigger>
          <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
          <TabsTrigger value="portal">Client Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Customers
                  </p>
                  <p className="text-2xl font-semibold">{totalCustomers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all pages
                  </p>
                </div>
                <div className="p-3 bg-[#007BFF]/10 rounded-full">
                  <Building className="w-6 h-6 text-[#007BFF]" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Customers
                  </p>
                  <p className="text-2xl font-semibold">
                    {
                      (customers || []).filter((c) => c.status === "Active")
                        .length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently active
                  </p>
                </div>
                <div className="p-3 bg-[#28A745]/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-[#28A745]" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-semibold">
                    $
                    {(
                      (customers || []).reduce(
                        (sum, c) => sum + (c.total_revenue || 0),
                        0
                      ) / 1000
                    ).toFixed(0)}
                    k
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From all customers
                  </p>
                </div>
                <div className="p-3 bg-[#FFC107]/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-[#FFC107]" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    High Priority
                  </p>
                  <p className="text-2xl font-semibold">
                    {
                      (customers || []).filter((c) => c.priority === "High")
                        .length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires attention
                  </p>
                </div>
                <div className="p-3 bg-[#DC3545]/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-[#DC3545]" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">
                        Customer Directory ({totalCustomers})
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        {viewMode === "grid" ? "Card View" : "Table View"}
                      </Badge>
                      {loading && (
                        <Badge variant="outline" className="animate-pulse">
                          Loading...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={
                          viewMode === "grid"
                            ? "bg-[#007BFF] hover:bg-[#0056b3]"
                            : ""
                        }
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={
                          viewMode === "table"
                            ? "bg-[#007BFF] hover:bg-[#0056b3]"
                            : ""
                        }
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Error State */}
                  {error && (
                    <div className="text-center py-8 text-red-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCustomers}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Card View */}
                  {!error && viewMode === "grid" && (
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full" />
                          <p className="text-sm">Loading customers...</p>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No customers found</p>
                          <p className="text-xs">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`group p-4 border-l-4 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${getPriorityColor(
                              customer.priority
                            )}`}
                            onClick={() => {
                              setSelectedCustomer(customer.id);
                              setShowCustomerDetail(true);
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-[#007BFF] text-white">
                                    {customer.name
                                      ? customer.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .substring(0, 2)
                                      : "CU"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">
                                    {customer.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {customer.industry}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={getStatusColor(customer.status)}
                              >
                                {customer.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {customer.contact.email}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {customer.contact.phone}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  ${(customer.contractValue / 1000).toFixed(0)}k
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {customer.website}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border/20">
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>
                                  {customer.project_ids?.length || 0} linked
                                  projects
                                </span>
                                <span>
                                  $
                                  {(
                                    (customer.total_revenue || 0) / 1000
                                  ).toFixed(0)}
                                  k revenue
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                  Last Activity:
                                </span>
                                <span className="text-sm font-medium">
                                  {customer.last_activity
                                    ? new Date(
                                        customer.last_activity
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Tags and Actions */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {customer.industry}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {customer.status}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  openEditCustomer(customer);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Table View */}
                  {!error && viewMode === "table" && (
                    <>
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full" />
                          <p className="text-sm">Loading customers...</p>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No customers found</p>
                          <p className="text-xs">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">
                                Customer
                              </TableHead>
                              <TableHead>Industry</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Revenue</TableHead>
                              <TableHead>Projects</TableHead>
                              <TableHead>Last Activity</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.map((customer) => (
                              <TableRow
                                key={customer.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                  setSelectedCustomer(customer.id);
                                  setShowCustomerDetail(true);
                                }}
                              >
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                                        {customer.name
                                          ? customer.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .substring(0, 2)
                                          : "CU"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">
                                        {customer.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {customer.contact.name}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {customer.industry}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getStatusColor(customer.status)}
                                  >
                                    {customer.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      customer.priority === "High"
                                        ? "border-[#DC3545] text-[#DC3545]"
                                        : customer.priority === "Medium"
                                        ? "border-[#FFC107] text-[#FFC107]"
                                        : "border-[#28A745] text-[#28A745]"
                                    }`}
                                  >
                                    {customer.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {customer.contact.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {customer.contact.phone}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    $
                                    {(
                                      (customer.total_revenue || 0) / 1000
                                    ).toFixed(0)}
                                    k
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      {customer.project_ids?.length || 0}
                                    </span>{" "}
                                    linked
                                    <span className="text-muted-foreground">
                                      {" "}
                                      projects
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {customer.last_activity
                                      ? new Date(
                                          customer.last_activity
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      openEditCustomer(customer);
                                    }}
                                    className="text-xs"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </>
                  )}

                  {/* Pagination */}
                  {!error && !loading && totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {endIndex} of{" "}
                        {totalCustomers} customers
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1);
                            const showEllipsis =
                              (page === 2 && currentPage > 4) ||
                              (page === totalPages - 1 &&
                                currentPage < totalPages - 3);

                            if (showEllipsis) {
                              return (
                                <span
                                  key={page}
                                  className="text-muted-foreground"
                                >
                                  ...
                                </span>
                              );
                            }

                            if (!showPage) return null;

                            return (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === page
                                    ? "bg-[#007BFF] hover:bg-[#0056b3]"
                                    : ""
                                }`}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Activity
                  </h3>

                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === "alert"
                              ? "bg-[#FFC107]/10"
                              : activity.type === "payment"
                              ? "bg-[#28A745]/10"
                              : "bg-[#007BFF]/10"
                          }`}
                        >
                          {activity.type === "alert" ? (
                            <AlertTriangle className="w-4 h-4 text-[#FFC107]" />
                          ) : activity.type === "payment" ? (
                            <DollarSign className="w-4 h-4 text-[#28A745]" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-[#007BFF]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.customer}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.activity}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Project Associations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(customers || []).map((customer) => {
              const customerProjectList = customerProjects.filter(
                (p) =>
                  customer.project_ids && customer.project_ids.includes(p.id)
              );
              return (
                <Card key={customer.id}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {customer.contact.name}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Linked Projects
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {customerProjectList.length} projects
                        </span>
                      </div>

                      {customerProjectList.length > 0 ? (
                        <div className="space-y-2">
                          {customerProjectList.map((project) => (
                            <div
                              key={project.id}
                              className="p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">
                                  {project.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      project.dueDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">
                                    {project.progress}%
                                  </span>
                                  <Progress
                                    value={project.progress}
                                    className="w-16 h-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No projects linked</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Link className="w-3 h-3 mr-1" />
                            Link Project
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Contract Value:
                      </span>
                      <span className="font-medium">
                        ${(customer.contractValue / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          {/* SLA Compliance Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  SLA Compliance Overview
                </h3>

                <div className="space-y-6">
                  {slaMetrics.map((metric) => {
                    const customer = customers.find(
                      (c) => c.id === metric.customerId
                    );
                    if (!customer) return null;

                    return (
                      <div
                        key={metric.customerId}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                                {customer.name
                                  ? customer.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                  : "CU"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{customer.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {customer.status} Customer
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${
                              customer.priority === "High"
                                ? "border-red-500 text-red-600"
                                : customer.priority === "Medium"
                                ? "border-yellow-500 text-yellow-600"
                                : "border-green-500 text-green-600"
                            }`}
                          >
                            {customer.priority} Priority
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              Response Time
                            </p>
                            <p className="text-sm font-semibold">
                              {metric.responseTimeCompliance.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Projects: {customer.project_ids?.length || 0}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              Resolution Time
                            </p>
                            <p className="text-sm font-semibold">
                              {metric.resolutionTimeCompliance.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Revenue: $
                              {((customer.total_revenue || 0) / 1000).toFixed(
                                0
                              )}
                              k
                            </p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              Uptime
                            </p>
                            <p className="text-sm font-semibold">
                              {metric.uptimeActual.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Status: {customer.status}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              Tickets
                            </p>
                            <p className="text-sm font-semibold">
                              {metric.ticketsOnTime}/{metric.ticketsTotal}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              On Time
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Response Time Compliance</span>
                            <span>
                              {metric.responseTimeCompliance.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={metric.responseTimeCompliance}
                            className="h-2"
                          />

                          <div className="flex items-center justify-between text-sm">
                            <span>Resolution Time Compliance</span>
                            <span>
                              {metric.resolutionTimeCompliance.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={metric.resolutionTimeCompliance}
                            className="h-2"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4">SLA Alerts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-[#FFC107]/10 rounded-lg border-l-4 border-[#FFC107]">
                      <AlertTriangle className="w-4 h-4 text-[#FFC107]" />
                      <div>
                        <p className="text-sm font-medium">
                          Tech Solutions Inc
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Response time approaching limit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Compliance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Overall Compliance:
                      </span>
                      <span className="text-sm font-medium text-[#28A745]">
                        92.8%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        At Risk Customers:
                      </span>
                      <span className="text-sm font-medium text-[#FFC107]">
                        1
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Critical Issues:
                      </span>
                      <span className="text-sm font-medium text-[#DC3545]">
                        0
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portal" className="space-y-6">
          {/* Client Portal Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Client Portal Access
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientPortal(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Portal
                  </Button>
                </div>

                <div className="space-y-4">
                  {customers?.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {customer.clientPortalAccess ? (
                          <>
                            <Badge className="bg-[#28A745] text-white">
                              <Shield className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedClientView(customer.id)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Portal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline">
                              <XCircle className="w-3 h-3 mr-1" />
                              Disabled
                            </Badge>
                            <Button
                              size="sm"
                              className="bg-[#28A745] hover:bg-[#218838] text-white"
                            >
                              Enable Access
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Portal Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active Portals:
                      </span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Monthly Logins:
                      </span>
                      <span className="text-sm font-medium">47</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avg Session Time:
                      </span>
                      <span className="text-sm font-medium">8.5 min</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Portal Features</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-[#28A745]" />
                      <span className="text-sm">Project Progress Tracking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-[#28A745]" />
                      <span className="text-sm">Milestone Visibility</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-[#28A745]" />
                      <span className="text-sm">Document Downloads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-[#28A745]" />
                      <span className="text-sm">Communication Hub</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Form Modal with Tabs */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="w-[1200px] h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {customerFormMode === "create"
                ? "Add New Customer"
                : "Edit Customer"}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeFormTab}
            onValueChange={setActiveFormTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              <TabsTrigger value="notes">Notes & Settings</TabsTrigger>
            </TabsList>

            <form
              onSubmit={
                customerFormMode === "create"
                  ? handleCreateCustomer
                  : handleEditCustomer
              }
              className="space-y-6"
            >
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Name *
                    </label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      placeholder="Enter company name..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Industry *
                    </label>
                    <Select
                      value={newCustomer.industry}
                      onValueChange={(value: string) =>
                        setNewCustomer({ ...newCustomer, industry: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingIndustries ? "Loading..." : "Select industry"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.id} value={industry.name}>
                            {industry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Website
                    </label>
                    <Input
                      value={newCustomer.website}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          website: e.target.value,
                        })
                      }
                      placeholder="www.company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Priority
                    </label>
                    <Select
                      value={newCustomer.priority}
                      onValueChange={(value: string) =>
                        setNewCustomer({ ...newCustomer, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Contact Name
                      </label>
                      <Input
                        value={newCustomer.contactName}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            contactName: e.target.value,
                          })
                        }
                        placeholder="Primary contact name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Contact Title
                      </label>
                      <Input
                        value={newCustomer.contactTitle}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            contactTitle: e.target.value,
                          })
                        }
                        placeholder="e.g., CEO, CTO, Manager..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            email: e.target.value,
                          })
                        }
                        placeholder="contact@company.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone
                      </label>
                      <Input
                        value={newCustomer.phone}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Street Address
                      </label>
                      <Input
                        value={newCustomer.street}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            street: e.target.value,
                          })
                        }
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City
                      </label>
                      <Input
                        value={newCustomer.city}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            city: e.target.value,
                          })
                        }
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        State/Province
                      </label>
                      <Input
                        value={newCustomer.state}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            state: e.target.value,
                          })
                        }
                        placeholder="State/Province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        ZIP/Postal Code
                      </label>
                      <Input
                        value={newCustomer.zip}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            zip: e.target.value,
                          })
                        }
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Country
                      </label>
                      <Input
                        value={newCustomer.country}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            country: e.target.value,
                          })
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, notes: e.target.value })
                    }
                    placeholder="Additional notes about the customer..."
                    rows={6}
                  />
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setEditingCustomer(null);
                    resetNewCustomerForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#28A745] hover:bg-[#218838] text-white"
                  disabled={saving}
                >
                  {saving
                    ? customerFormMode === "create"
                      ? "Creating..."
                      : "Updating..."
                    : customerFormMode === "create"
                    ? "Create Customer"
                    : "Update Customer"}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Client Portal Preview Modal */}
      <Dialog open={showClientPortal} onOpenChange={setShowClientPortal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Portal Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Portal Navigation */}
            <div className="flex items-center justify-between p-4 bg-[#28A745] text-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Acme Corporation Portal</h3>
                  <p className="text-sm opacity-90">Welcome, John Smith</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-white/20 text-white border-white/20"
              >
                Client View
              </Badge>
            </div>

            {/* Client Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Active Projects</h4>
                    <Briefcase className="w-5 h-5 text-[#007BFF]" />
                  </div>
                  <p className="text-2xl font-semibold">2</p>
                  <p className="text-sm text-muted-foreground">
                    Currently in progress
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Upcoming Milestones</h4>
                    <Flag className="w-5 h-5 text-[#FFC107]" />
                  </div>
                  <p className="text-2xl font-semibold">3</p>
                  <p className="text-sm text-muted-foreground">Next 30 days</p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Support Tickets</h4>
                    <MessageSquare className="w-5 h-5 text-[#28A745]" />
                  </div>
                  <p className="text-2xl font-semibold">0</p>
                  <p className="text-sm text-muted-foreground">Open tickets</p>
                </div>
              </Card>
            </div>

            {/* Project Progress */}
            <Card>
              <div className="p-6">
                <h4 className="font-semibold mb-4">Project Progress</h4>
                <div className="space-y-4">
                  {customerProjects
                    .filter((p) => p.customerId === "CUST-001")
                    .map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium">{project.name}</h5>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">
                              Overall Progress
                            </span>
                            <span className="text-sm font-medium">
                              {project.progress}%
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <h6 className="text-sm font-medium">Milestones:</h6>
                          {project.milestones.map((milestone: any) => (
                            <div
                              key={milestone.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                {milestone.status === "Completed" ? (
                                  <CheckCircle className="w-4 h-4 text-[#28A745]" />
                                ) : milestone.status === "In Progress" ? (
                                  <Clock className="w-4 h-4 text-[#007BFF]" />
                                ) : (
                                  <Timer className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span>{milestone.name}</span>
                              </div>
                              <div className="text-muted-foreground">
                                {milestone.status === "Completed" &&
                                milestone.completedDate
                                  ? `Completed ${new Date(
                                      milestone.completedDate
                                    ).toLocaleDateString()}`
                                  : `Due ${new Date(
                                      milestone.dueDate
                                    ).toLocaleDateString()}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>

            {/* Communication Section */}
            <Card>
              <div className="p-6">
                <h4 className="font-semibold mb-4">Recent Updates</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-[#28A745]/10 rounded-full">
                      <CheckCircle className="w-4 h-4 text-[#28A745]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Milestone Completed: UI/UX Design
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Web App Redesign project milestone completed ahead of
                        schedule
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        2 days ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-[#007BFF]/10 rounded-full">
                      <Activity className="w-4 h-4 text-[#007BFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Progress Update: Frontend Development
                      </p>
                      <p className="text-sm text-muted-foreground">
                        75% complete - on track for September 15th deadline
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 week ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Modal */}
      <Dialog open={showCustomerDetail} onOpenChange={setShowCustomerDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {selectedCustomer &&
            (() => {
              const customer = customers.find((c) => c.id === selectedCustomer);
              if (!customer) return null;

              return (
                <div className="space-y-6">
                  {/* Customer Header */}
                  <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#007BFF] text-white">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {customer.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {customer.industry}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                          {customer.clientPortalAccess && (
                            <Badge variant="outline">
                              <Shield className="w-3 h-3 mr-1" />
                              Portal Access
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Customer
                    </Button>
                  </div>

                  {/* Contact Information */}
                  <Card>
                    <div className="p-6">
                      <h4 className="font-semibold mb-4">
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {customer.contact.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {customer.contact.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{customer.contact.email}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{customer.contact.phone}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span>{customer.website}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-2">Address</p>
                          <div className="text-sm text-muted-foreground">
                            <p>{customer.address.street}</p>
                            <p>
                              {customer.address.city}, {customer.address.state}{" "}
                              {customer.address.zip}
                            </p>
                            <p>{customer.address.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* SLA & Billing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <div className="p-6">
                        <h4 className="font-semibold mb-4">Customer Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Status:
                            </span>
                            <Badge variant="outline">{customer.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Priority:
                            </span>
                            <span className="text-sm font-medium">
                              {customer.priority}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Projects:
                            </span>
                            <span className="text-sm font-medium">
                              {customer.project_ids?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="text-sm font-medium">
                              $
                              {((customer.total_revenue || 0) / 1000).toFixed(
                                0
                              )}
                              k
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="p-6">
                        <h4 className="font-semibold mb-4">
                          Billing Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Contract Value:
                            </span>
                            <span className="text-sm font-medium">
                              ${(customer?.contractValue / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Payment Terms:
                            </span>
                            <span className="text-sm font-medium">
                              {customer?.billingInfo?.paymentTerms || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Billing Contact:
                            </span>
                            <span className="text-sm font-medium">
                              {customer?.billingInfo?.billingContact}
                            </span>
                          </div>
                          {customer?.billingInfo?.nextInvoice && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Next Invoice:
                              </span>
                              <span className="text-sm font-medium">
                                {new Date(
                                  customer?.billingInfo?.nextInvoice
                                )?.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
