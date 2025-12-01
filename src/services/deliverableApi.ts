import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface Deliverable {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_id: string;
  milestone_name: string;
  story_id?: string;
  deliverable_type: string;
  status:
    | "pending"
    | "in-progress"
    | "submitted"
    | "under-review"
    | "approved"
    | "rejected"
    | "completed";
  progress: number;
  priority: "low" | "medium" | "high" | "critical";
  due_date: string;
  submission_date?: string;
  approval_date?: string;
  owner_id: string;
  owner_name: string;
  reviewer_id: string;
  reviewer_name: string;
  acceptance_criteria: string;
  review_comments?: string;
  file_path?: string;
  version: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeliverableRequest {
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_id: string;
  milestone_name: string;
  story_id?: string;
  deliverable_type: string;
  status:
    | "pending"
    | "in-progress"
    | "submitted"
    | "under-review"
    | "approved"
    | "rejected"
    | "completed";
  progress: number;
  priority: "low" | "medium" | "high" | "critical";
  due_date: string;
  submission_date?: string;
  approval_date?: string;
  owner_id: string;
  owner_name: string;
  reviewer_id: string;
  reviewer_name: string;
  acceptance_criteria: string;
  review_comments?: string;
  file_path?: string;
  version: string;
  notes?: string;
}

export interface UpdateDeliverableRequest
  extends Partial<CreateDeliverableRequest> {
  id?: string;
}

export interface DeliverablesResponse {
  items: Deliverable[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class DeliverableApiService {
  async getDeliverables(
    projectId?: string,
    phaseId?: string,
    milestoneId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<DeliverablesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    if (phaseId) {
      params.append("phase_id", phaseId);
    }

    if (milestoneId) {
      params.append("milestone_id", milestoneId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/deliverables${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axiosInstance.get<DeliverablesResponse>(endpoint);
    return response.data;
  }

  async getDeliverableById(id: string): Promise<Deliverable> {
    const response = await axiosInstance.get<Deliverable>(
      `/api/v1/deliverables/${id}`
    );
    return response.data;
  }

  async createDeliverable(
    deliverableData: CreateDeliverableRequest
  ): Promise<Deliverable> {
    const response = await axiosInstance.post<Deliverable>(
      "/api/v1/deliverables/",
      deliverableData
    );

    return response.data;
  }

  async updateDeliverable(
    id: string,
    deliverableData: UpdateDeliverableRequest
  ): Promise<Deliverable> {
    const response = await axiosInstance.put<Deliverable>(
      `/api/v1/deliverables/${id}`,
      deliverableData
    );
    return response.data;
  }

  async deleteDeliverable(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(
      `/api/v1/deliverables/${id}`
    );
    return response.data;
  }

  async updateDeliverableStatus(
    id: string,
    status: string
  ): Promise<Deliverable> {
    const response = await axiosInstance.patch<Deliverable>(
      `/api/v1/deliverables/${id}`,
      { status }
    );
    return response.data;
  }

  async updateDeliverableProgress(
    id: string,
    progress: number
  ): Promise<Deliverable> {
    const response = await axiosInstance.patch<Deliverable>(
      `/api/v1/deliverables/${id}`,
      { progress }
    );
    return response.data;
  }

  async submitDeliverable(
    id: string,
    submissionDate: string,
    filePath?: string
  ): Promise<Deliverable> {
    const response = await axiosInstance.patch<Deliverable>(
      `/api/v1/deliverables/${id}`,
      {
        status: "submitted",
        submission_date: submissionDate,
        file_path: filePath,
      }
    );
    return response.data;
  }

  async approveDeliverable(
    id: string,
    approvalDate: string,
    reviewComments?: string
  ): Promise<Deliverable> {
    const response = await axiosInstance.patch<Deliverable>(
      `/api/v1/deliverables/${id}`,
      {
        status: "approved",
        approval_date: approvalDate,
        review_comments: reviewComments,
      }
    );
    return response.data;
  }

  async rejectDeliverable(
    id: string,
    reviewComments: string
  ): Promise<Deliverable> {
    const response = await axiosInstance.patch<Deliverable>(
      `/api/v1/deliverables/${id}`,
      {
        status: "rejected",
        review_comments: reviewComments,
      }
    );
    return response.data;
  }
}

export const deliverableApiService = new DeliverableApiService();
