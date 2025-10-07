import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface FileItem {
  id: string;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  category?: string;
  folder_id?: string;
  folder_name?: string;
  tags?: string[];
  project_id: string;
  story_id?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  uploaded_at: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  parent_folder_id?: string;
  created_by: string;
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
  file: File;
  project_id: string;
  folder_id?: string;
  category?: string;
  tags?: string[];
  story_id?: string;
}

export class FilesApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);

    const token = authApiService.getAccessToken();

    const defaultHeaders: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` })
    };

    // Don't set Content-Type for FormData - browser will set it automatically with boundary
    if (!(options?.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        try {
          await authApiService.refreshToken();
          const newToken = authApiService.getAccessToken();

          const retryHeaders: HeadersInit = {
            ...(newToken && { Authorization: `Bearer ${newToken}` })
          };

          if (!(options?.body instanceof FormData)) {
            retryHeaders['Content-Type'] = 'application/json';
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          authApiService.clearTokens();
          authApiService.clearUserProfile();
          throw new Error('Authentication failed. Please login again.');
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // File operations
  async getFiles(
    projectId: string,
    page: number = 1,
    perPage: number = 50,
    folderId?: string,
    category?: string
  ): Promise<FilesResponse> {
    const params = new URLSearchParams({
      project_id: projectId,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (folderId) {
      params.append('folder_id', folderId);
    }

    if (category && category !== 'all') {
      params.append('category', category);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/files${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<FilesResponse>(endpoint);
  }

  async getFile(id: string): Promise<FileItem> {
    return this.makeRequest<FileItem>(`/api/v1/files/${id}`);
  }

  async uploadFile(uploadRequest: UploadFileRequest): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('project_id', uploadRequest.project_id);

    if (uploadRequest.folder_id) {
      formData.append('folder_id', uploadRequest.folder_id);
    }

    if (uploadRequest.category) {
      formData.append('category', uploadRequest.category);
    }

    if (uploadRequest.tags && uploadRequest.tags.length > 0) {
      formData.append('tags', JSON.stringify(uploadRequest.tags));
    }

    if (uploadRequest.story_id) {
      formData.append('story_id', uploadRequest.story_id);
    }

    return this.makeRequest<FileItem>('/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadMultipleFiles(files: File[], projectId: string, folderId?: string, category?: string): Promise<FileItem[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('project_id', projectId);

    if (folderId) {
      formData.append('folder_id', folderId);
    }

    if (category) {
      formData.append('category', category);
    }

    return this.makeRequest<FileItem[]>('/api/v1/files/upload-multiple', {
      method: 'POST',
      body: formData,
    });
  }

  async updateFile(id: string, updateData: UpdateFileRequest): Promise<FileItem> {
    return this.makeRequest<FileItem>(`/api/v1/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteFile(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/files/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadFile(id: string): Promise<Blob> {
    const url = getApiUrl(`/api/v1/files/${id}/download`);
    const token = authApiService.getAccessToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }

  // Folder operations
  async getFolders(projectId: string): Promise<FoldersResponse> {
    const params = new URLSearchParams({
      project_id: projectId,
    });

    return this.makeRequest<FoldersResponse>(`/api/v1/folders?${params.toString()}`);
  }

  async getFolder(id: string): Promise<Folder> {
    return this.makeRequest<Folder>(`/api/v1/folders/${id}`);
  }

  async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    const projectId = folderData.project_id;
    return this.makeRequest<Folder>(`/api/v1/files/projects/${projectId}/create-folder`, {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
  }

  async updateFolder(id: string, updateData: UpdateFolderRequest): Promise<Folder> {
    return this.makeRequest<Folder>(`/api/v1/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteFolder(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // File categories
  async getFileCategories(projectId: string): Promise<FileCategory[]> {
    return this.makeRequest<FileCategory[]>(`/api/v1/files/projects/${projectId}/file-categories`);
  }
}

export const filesApiService = new FilesApiService();
