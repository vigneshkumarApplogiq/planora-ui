import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { 
  Search,
  CheckSquare,
  FolderOpen,
  Users,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  user?: any
}

export function GlobalSearch({ isOpen, onClose, user }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResults, setFilteredResults] = useState({
    tasks: [] as any[],
    projects: [] as any[],
    users: [] as any[]
  })

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults({ tasks: [], projects: [], users: [] })
      return
    }

    // TODO: Implement actual API search
    setFilteredResults({ tasks: [], projects: [], users: [] })
  }, [searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-[#007BFF] text-white'
      case 'Todo': return 'bg-[#6C757D] text-white'
      case 'Done': return 'bg-[#28A745] text-white'
      case 'Planning': return 'bg-[#FFC107] text-white'
      case 'Active': return 'bg-[#28A745] text-white'
      default: return 'bg-muted text-foreground'
    }
  }

  const handleResultClick = (type: string, id: string) => {
    // In a real app, this would navigate to the specific item
    onClose()
  }

  const totalResults = filteredResults.tasks.length + filteredResults.projects.length + filteredResults.users.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[920px] max-w-[920px] max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>Search for tasks, projects, and users across your workspace</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border/20 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks, projects, users..."
              className="pl-10 border-none shadow-none focus:ring-0"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {!searchTerm.trim() ? (
            /* Empty State */
            <div className="p-8 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search Everything</h3>
              <p className="text-muted-foreground mb-4">
                Find tasks, projects, users, and more across your workspace
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><kbd className="bg-muted px-2 py-1 rounded text-xs">Enter</kbd> to select</p>
                <p><kbd className="bg-muted px-2 py-1 rounded text-xs">↑↓</kbd> to navigate</p>
                <p><kbd className="bg-muted px-2 py-1 rounded text-xs">Esc</kbd> to close</p>
              </div>
            </div>
          ) : totalResults === 0 ? (
            /* No Results */
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse by category
              </p>
            </div>
          ) : (
            /* Results */
            <div className="p-4 space-y-6">
              {/* Tasks */}
              {filteredResults.tasks.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Tasks ({filteredResults.tasks.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {filteredResults.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleResultClick('task', task.id)}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant="outline" className="text-xs">{task.id}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{task.project}</span>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{task.assignee}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {filteredResults.projects.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Projects ({filteredResults.projects.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {filteredResults.projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleResultClick('project', project.id)}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{project.name}</h4>
                            <Badge variant="outline" className="text-xs">{project.id}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{project.customer}</span>
                            <span>{project.progress}% complete</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {filteredResults.users.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      People ({filteredResults.users.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {filteredResults.users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleResultClick('user', user.id)}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{user.role}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 p-3 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Use ↑↓ to navigate</span>
              <span>Enter to select</span>
              <span>Esc to close</span>
            </div>
            {totalResults > 0 && (
              <span>{totalResults} result{totalResults !== 1 ? 's' : ''} found</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}