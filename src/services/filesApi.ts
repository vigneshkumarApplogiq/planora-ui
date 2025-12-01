import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface FileItem {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  file_extension?: string;
  category?: string;
  entity_type?: string;
  entity_id?: string;
  entity_title?: string;
  project_id: string;
  folder_id?: string;
  folder_name?: string;
  description?: string;
  tags?: string;
  is_public?: boolean;
  uploaded_by_id: string;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by_id?: string;
  // Legacy fields for backwards compatibility
  name?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  parent_folder_id?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
  file_count?: number;
}

export interface FilesResponse {
  items: FileItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FoldersResponse {
  items: Folder[];
  total: number;
}

export interface FileCategory {
  category: string;
  count: number;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  project_id: string;
  parent_folder_id?: string;
  created_by_id?: string;
  created_by_name?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
}

export interface UpdateFileRequest {
  name?: string;
  category?: string;
  folder_id?: string;
  tags?: string[];
}

export interface UploadFileRequest {
  files: File[];
  project_id: string;
  folder_id?: string;
  category?: string;
  description?: string;
  tags?: string;
  is_public?: boolean;
}

export class FilesApiService {
  // File operations
  async getFiles(projectId: string): Promise<FileItem[]> {
    const response = await axiosInstance.get<FileItem[]>(
      `/api/v1/files/projects/${projectId}/files`
    );
    return response.data;
  }

  async getFile(id: string): Promise<FileItem> {
    const response = await axiosInstance.get<FileItem>(`/api/v1/files/${id}`);
    return response.data;
  }

  async uploadFile(uploadRequest: UploadFileRequest): Promise<FileItem[]> {
    const formData = new FormData();

    // Append all files
    uploadRequest.files.forEach((file) => {
      formData.append("files", file);
    });

    if (uploadRequest.folder_id) {
      formData.append("folder_id", uploadRequest.folder_id);
    }

    if (uploadRequest.category) {
      formData.append("category", uploadRequest.category);
    }

    if (uploadRequest.description) {
      formData.append("description", uploadRequest.description);
    }

    if (uploadRequest.tags) {
      formData.append("tags", uploadRequest.tags);
    }

    if (uploadRequest.is_public !== undefined) {
      formData.append("is_public", uploadRequest.is_public.toString());
    }

    const projectId = uploadRequest.project_id;
    const response = await axiosInstance.post<FileItem[]>(
      `/api/v1/files/projects/${projectId}/upload-files`,
      formData
    );
    return response.data;
  }

  async uploadMultipleFiles(
    files: File[],
    projectId: string,
    folderId?: string,
    category?: string
  ): Promise<FileItem[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("project_id", projectId);

    if (folderId) {
      formData.append("folder_id", folderId);
    }

    if (category) {
      formData.append("category", category);
    }
    const response = await axiosInstance.post<FileItem[]>(
      "/api/v1/files/upload-multiple",
      formData
    );
    return response.data;
  }

  async updateFile(
    id: string,
    updateData: UpdateFileRequest
  ): Promise<FileItem> {
    const response = await axiosInstance.put<FileItem>(
      `/api/v1/files/${id}`,
      updateData
    );

    return response.data;
  }

  async deleteFile(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/files/${id}`);
    return response.data;
  }

  async downloadFile(id: string): Promise<Blob> {
    const url = getApiUrl(`/api/v1/files/${id}/download`);
    const token = authApiService.getAccessToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    return response.blob();
  }

  // Folder operations
  async getFolders(projectId: string): Promise<FoldersResponse> {
    const params = new URLSearchParams({
      project_id: projectId,
    });
    const response = await axiosInstance.get<FoldersResponse>(
      `/api/v1/folders?${params.toString()}`
    );
    return response.data;
  }

  async getFoldersList(projectId: string): Promise<Folder[]> {
    const response = await axiosInstance.get<Folder[]>(
      `/api/v1/files/projects/${projectId}/folders-list`
    );
    return response.data;
  }

  async getFolder(id: string): Promise<Folder> {
    const response = await axiosInstance.get<Folder>(`/api/v1/folders/${id}`);
    return response.data;
  }

  async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    const projectId = folderData.project_id;

    const response = await axiosInstance.post<Folder>(
      `/api/v1/files/projects/${projectId}/create-folder`,
      folderData
    );
    return response.data;
  }

  async updateFolder(
    id: string,
    updateData: UpdateFolderRequest
  ): Promise<Folder> {
    const response = await axiosInstance.put<Folder>(
      `/api/v1/folders/${id}`,
      updateData
    );
    return response.data;
  }

  async deleteFolder(projectId: string, id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/files/projects/${projectId}/folders/${id}`);
    return response.data;
  }

  // File categories
  async getFileCategories(projectId: string): Promise<FileCategory[]> {
    const response = await axiosInstance.get<FileCategory[]>(
      `/api/v1/files/projects/${projectId}/file-categories`
    );
    return response.data;
  }
}

export const filesApiService = new FilesApiService();
