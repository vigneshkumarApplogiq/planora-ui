import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import {
  Upload,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Image,
  Video,
  File,
  Download,
  Eye,
  Trash2,
  Share2,
  FolderOpen,
  Plus,
  X,
  Edit,
  Folder,
  AlertCircle
} from 'lucide-react'
import { filesApiService, FileItem, Folder as FolderType, CreateFolderRequest, UpdateFileRequest, FileCategory } from '../../services/filesApi'
import { toast } from 'sonner'

interface FilesViewProps {
  projectId: string
  user: any
}

export function FilesView({ projectId, user }: FilesViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [fileCategories, setFileCategories] = useState<FileCategory[]>([])

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadCategory, setUploadCategory] = useState<string>('none')
  const [uploadFolderId, setUploadFolderId] = useState<string | undefined>(undefined)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create folder modal state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Edit file modal state
  const [showEditFileModal, setShowEditFileModal] = useState(false)
  const [editingFile, setEditingFile] = useState<FileItem | null>(null)
  const [editFileName, setEditFileName] = useState('')
  const [editFileCategory, setEditFileCategory] = useState('')
  const [editFileFolderId, setEditFileFolderId] = useState<string | undefined>(undefined)
  const [updatingFile, setUpdatingFile] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{type: 'file' | 'folder', id: string, name: string} | null>(null)

  useEffect(() => {
    if (projectId) {
      loadFiles()
      loadFolders()
      loadFileCategories()
    }
  }, [projectId, selectedCategory, selectedFolder])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await filesApiService.getFiles(
        projectId,
        1,
        100,
        selectedFolder,
        selectedCategory !== 'all' ? selectedCategory : undefined
      )
      setFiles(response.items)
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      const response = await filesApiService.getFolders(projectId)
      setFolders(response.items)
    } catch (error) {
      console.error('Failed to load folders:', error)
      toast.error('Failed to load folders')
    }
  }

  const loadFileCategories = async () => {
    try {
      const categories = await filesApiService.getFileCategories(projectId)
      setFileCategories(categories)
    } catch (error) {
      console.error('Failed to load file categories:', error)
      // Don't show error toast, use default categories as fallback
      setFileCategories([
        { category: 'Documentation', count: 0 },
        { category: 'Design', count: 0 },
        { category: 'Development', count: 0 },
        { category: 'Testing', count: 0 },
        { category: 'Meetings', count: 0 },
        { category: 'Other', count: 0 }
      ])
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Folder name is required')
      return
    }

    try {
      setCreatingFolder(true)
      const folderData: CreateFolderRequest = {
        name: folderName.trim(),
        description: folderDescription.trim() || undefined,
        entity_type: 'project',
        entity_id: projectId,
        project_id: projectId,
        created_by_id: user?.id || user?.user_id,
        created_by_name: user?.name || user?.username || 'Unknown'
      }

      await filesApiService.createFolder(folderData)
      toast.success('Folder created successfully')
      setShowCreateFolderModal(false)
      setFolderName('')
      setFolderDescription('')
      loadFolders()
      loadFileCategories() // Refresh categories as well
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast.error('Failed to create folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const fileList = Array.from(selectedFiles)
    setUploadFiles(prev => [...prev, ...fileList])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    setUploadFiles(prev => [...prev, ...droppedFiles])
  }

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    try {
      setUploading(true)

      // Upload files one by one (or use uploadMultipleFiles if backend supports it)
      for (const file of uploadFiles) {
        await filesApiService.uploadFile({
          file,
          project_id: projectId,
          folder_id: uploadFolderId,
          category: uploadCategory !== 'none' ? uploadCategory : undefined
        })
      }

      toast.success(`${uploadFiles.length} file(s) uploaded successfully`)
      setShowUploadModal(false)
      setUploadFiles([])
      setUploadCategory('none')
      setUploadFolderId(undefined)
      loadFiles()
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleEditFile = (file: FileItem) => {
    setEditingFile(file)
    setEditFileName(file.original_filename || file.name)
    setEditFileCategory(file.category || '')
    setEditFileFolderId(file.folder_id)
    setShowEditFileModal(true)
  }

  const handleUpdateFile = async () => {
    if (!editingFile) return

    if (!editFileName.trim()) {
      toast.error('File name is required')
      return
    }

    try {
      setUpdatingFile(true)
      const updateData: UpdateFileRequest = {
        name: editFileName.trim(),
        category: editFileCategory || undefined,
        folder_id: editFileFolderId
      }

      await filesApiService.updateFile(editingFile.id, updateData)
      toast.success('File updated successfully')
      setShowEditFileModal(false)
      setEditingFile(null)
      loadFiles()
    } catch (error) {
      console.error('Failed to update file:', error)
      toast.error('Failed to update file')
    } finally {
      setUpdatingFile(false)
    }
  }

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const blob = await filesApiService.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_filename || file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Failed to download file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      if (deletingItem.type === 'file') {
        await filesApiService.deleteFile(deletingItem.id)
        toast.success('File deleted successfully')
        loadFiles()
      } else {
        await filesApiService.deleteFolder(deletingItem.id)
        toast.success('Folder deleted successfully')
        loadFolders()
        if (selectedFolder === deletingItem.id) {
          setSelectedFolder(undefined)
        }
      }
      setShowDeleteConfirm(false)
      setDeletingItem(null)
    } catch (error) {
      console.error(`Failed to delete ${deletingItem.type}:`, error)
      toast.error(`Failed to delete ${deletingItem.type}`)
    }
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-green-600" />
    } else if (contentType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-600" />
    } else if (contentType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-600" />
    } else if (contentType.includes('document') || contentType.includes('word')) {
      return <FileText className="w-8 h-8 text-blue-600" />
    } else if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      return <FileText className="w-8 h-8 text-green-600" />
    } else {
      return <File className="w-8 h-8 text-gray-600" />
    }
  }

  const getFileTypeColor = (contentType: string) => {
    if (contentType.includes('pdf')) return 'bg-red-100 text-red-800'
    if (contentType.startsWith('image/')) return 'bg-green-100 text-green-800'
    if (contentType.startsWith('video/')) return 'bg-purple-100 text-purple-800'
    if (contentType.includes('document')) return 'bg-blue-100 text-blue-800'
    if (contentType.includes('spreadsheet')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const FileCard = ({ file }: { file: FileItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          {getFileIcon(file.content_type)}
          <div className="relative group">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="w-3 h-3" />
            </Button>
            <div className="absolute right-0 mt-1 hidden group-hover:block bg-white shadow-lg rounded-md border z-10 min-w-[120px]">
              <button
                onClick={() => handleEditFile(file)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                <Edit className="w-3 h-3 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  setDeletingItem({ type: 'file', id: file.id, name: file.original_filename })
                  setShowDeleteConfirm(true)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center text-sm text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <h4 className="font-medium text-sm mb-2 line-clamp-2">{file.original_filename}</h4>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className={getFileTypeColor(file.content_type)} style={{ fontSize: '10px' }}>
            {file.content_type.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatFileSize(file.file_size)}
          </Badge>
          {file.category && (
            <Badge variant="outline" className="text-xs">
              {file.category}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="bg-[#28A745] text-white text-xs">
                {file.uploaded_by_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span>{file.uploaded_by_name || 'Unknown'}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          {formatDate(file.uploaded_at)}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownloadFile(file)}>
            <Download className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const FileListItem = ({ file }: { file: FileItem }) => (
    <Card className="hover:shadow-md transition-shadow mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {getFileIcon(file.content_type)}

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1 truncate">{file.original_filename}</h4>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{file.category || 'Uncategorized'}</span>
                <span>•</span>
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>Uploaded by {file.uploaded_by_name || 'Unknown'}</span>
                <span>•</span>
                <span>{formatDate(file.uploaded_at)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={getFileTypeColor(file.content_type)} style={{ fontSize: '10px' }}>
                {file.content_type.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadFile(file)}>
                <Download className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEditFile(file)}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={() => {
                  setDeletingItem({ type: 'file', id: file.id, name: file.original_filename })
                  setShowDeleteConfirm(true)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Files</h2>
          <p className="text-muted-foreground">Manage project documents and assets</p>
        </div>

        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedFolder === undefined ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-between"
                onClick={() => setSelectedFolder(undefined)}
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>All Files</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {files.length}
                </Badge>
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingItem({ type: 'folder', id: folder.id, name: folder.name })
                      setShowDeleteConfirm(true)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-between"
                onClick={() => setSelectedCategory('all')}
              >
                <span>All Categories</span>
                <Badge variant="outline" className="text-xs">
                  {fileCategories.reduce((sum, cat) => sum + cat.count, 0)}
                </Badge>
              </Button>
              {fileCategories.map((categoryItem) => (
                <Button
                  key={categoryItem.category}
                  variant={selectedCategory === categoryItem.category ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(categoryItem.category)}
                >
                  <span>{categoryItem.category}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryItem.count}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowCreateFolderModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Files Content */}
        <div className="lg:col-span-3">
          {/* File Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#007BFF]">{filteredFiles.length}</div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#28A745]">
                  {(filteredFiles.reduce((sum, file) => sum + file.file_size, 0) / (1024 * 1024)).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Total Size (MB)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#FFC107]">{folders.length}</div>
                <div className="text-xs text-muted-foreground">Folders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#DC3545]">
                  {new Set(files.map(f => f.uploaded_by)).size}
                </div>
                <div className="text-xs text-muted-foreground">Contributors</div>
              </CardContent>
            </Card>
          </div>

          {/* Files Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading files...</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <FileListItem key={file.id} file={file} />
              ))}
            </div>
          )}

          {!loading && filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No files found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first file to get started'}
              </p>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Files Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files to your project. Supports images, documents, videos, and more.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                Support for images, documents, videos, and more (max 50MB per file)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            {/* Selected Files List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({uploadFiles.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {uploadFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => removeUploadFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category and Folder Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upload-category">Category (Optional)</Label>
                <Select
                  value={uploadCategory}
                  onValueChange={(value) => setUploadCategory(value)}
                >
                  <SelectTrigger id="upload-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {fileCategories.map((categoryItem) => (
                      <SelectItem key={categoryItem.category} value={categoryItem.category}>
                        {categoryItem.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="upload-folder">Folder (Optional)</Label>
                <Select
                  value={uploadFolderId || 'none'}
                  onValueChange={(value) => setUploadFolderId(value === 'none' ? undefined : value)}
                >
                  <SelectTrigger id="upload-folder">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadModal(false)
              setUploadFiles([])
              setUploadCategory('none')
              setUploadFolderId(undefined)
            }}>
              Cancel
            </Button>
            <Button
              className="bg-[#28A745] hover:bg-[#218838]"
              onClick={handleUploadFiles}
              disabled={uploading || uploadFiles.length === 0}
            >
              {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Modal */}
      <Dialog open={showCreateFolderModal} onOpenChange={setShowCreateFolderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your project files
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name *</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Textarea
                id="folder-description"
                placeholder="Enter folder description"
                rows={3}
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateFolderModal(false)
              setFolderName('')
              setFolderDescription('')
            }}>
              Cancel
            </Button>
            <Button
              className="bg-[#28A745] hover:bg-[#218838]"
              onClick={handleCreateFolder}
              disabled={creatingFolder || !folderName.trim()}
            >
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit File Modal */}
      <Dialog open={showEditFileModal} onOpenChange={setShowEditFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
            <DialogDescription>
              Update file information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-file-name">File Name *</Label>
              <Input
                id="edit-file-name"
                placeholder="Enter file name"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-file-category">Category</Label>
              <Select value={editFileCategory || 'none'} onValueChange={(value) => setEditFileCategory(value === 'none' ? '' : value)}>
                <SelectTrigger id="edit-file-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {fileCategories.map((categoryItem) => (
                    <SelectItem key={categoryItem.category} value={categoryItem.category}>
                      {categoryItem.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-file-folder">Folder</Label>
              <Select
                value={editFileFolderId || 'none'}
                onValueChange={(value) => setEditFileFolderId(value === 'none' ? undefined : value)}
              >
                <SelectTrigger id="edit-file-folder">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditFileModal(false)
              setEditingFile(null)
            }}>
              Cancel
            </Button>
            <Button
              className="bg-[#28A745] hover:bg-[#218838]"
              onClick={handleUpdateFile}
              disabled={updatingFile || !editFileName.trim()}
            >
              {updatingFile ? 'Updating...' : 'Update File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingItem && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">{deletingItem.name}</p>
                <p className="text-xs text-red-700">
                  {deletingItem.type === 'folder' ? 'All files in this folder will also be deleted' : 'This file will be permanently deleted'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteConfirm(false)
              setDeletingItem(null)
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
            >
              Delete {deletingItem?.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
