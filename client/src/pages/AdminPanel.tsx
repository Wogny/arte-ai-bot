import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Mail,
  Crown,
  TrendingUp,
  Calendar,
  CreditCard,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Copy,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminPanel() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Queries
  const { data: stats, isLoading: loadingStats } = trpc.adminUsers.getStats.useQuery();
  const { data: usersData, isLoading: loadingUsers, refetch } = trpc.adminUsers.listUsers.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter,
  });

  // Mutations
  const updateRoleMutation = trpc.adminUsers.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Papel do usuário atualizado!");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteUserMutation = trpc.adminUsers.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado!");
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const bulkActionMutation = trpc.adminUsers.bulkAction.useMutation({
    onSuccess: (data: { affected: number }) => {
      toast.success(`${data.affected} usuários afetados`);
      setSelectedUsers([]);
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const createInviteMutation = trpc.adminUsers.createInvite.useMutation({
    onSuccess: (data: { inviteLink: string }) => {
      toast.success("Convite criado!");
      navigator.clipboard.writeText(data.inviteLink);
      toast.info("Link copiado para a área de transferência");
      setShowInviteDialog(false);
      setInviteEmail("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSelectAll = () => {
    if (selectedUsers.length === usersData?.users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData?.users.map((u: any) => u.id) || []);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkAction = (action: "delete" | "makeAdmin" | "removeAdmin") => {
    if (selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um usuário");
      return;
    }
    bulkActionMutation.mutate({ userIds: selectedUsers, action });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              Painel de Administração
            </h1>
            <p className="text-gray-400 mt-1">Gerencie usuários, convites e permissões</p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Convidar Novo Usuário</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Envie um convite por email para adicionar um novo membro à equipe.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Email</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Papel</label>
                  <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                  disabled={!inviteEmail || createInviteMutation.isPending}
                >
                  {createInviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-gray-400">Total Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.newUsersThisMonth || 0}</p>
                  <p className="text-xs text-gray-400">Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.newUsersThisWeek || 0}</p>
                  <p className="text-xs text-gray-400">Esta Semana</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalAdmins || 0}</p>
                  <p className="text-xs text-gray-400">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <CreditCard className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</p>
                  <p className="text-xs text-gray-400">Assinaturas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{selectedUsers.length} selecionados</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações em Massa
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction("makeAdmin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Tornar Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction("removeAdmin")}>
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Remover Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleBulkAction("delete")}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Usuários</CardTitle>
            <CardDescription className="text-gray-400">
              {usersData?.pagination.total || 0} usuários encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4">
                          <Checkbox
                            checked={selectedUsers.length === usersData?.users.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Usuário</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Papel</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Cadastro</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData?.users.map((user: any) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="text-white font-medium">{user.name || "Sem nome"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{user.email}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className={user.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : ""}
                            >
                              {user.role === "admin" ? (
                                <Crown className="w-3 h-3 mr-1" />
                              ) : null}
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.role === "user" ? (
                                  <DropdownMenuItem
                                    onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "admin" })}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Tornar Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "user" })}
                                  >
                                    <ShieldOff className="w-4 h-4 mr-2" />
                                    Remover Admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteUserMutation.mutate({ userId: user.id })}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersData && usersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Página {usersData.pagination.page} de {usersData.pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(usersData.pagination.totalPages, p + 1))}
                        disabled={page === usersData.pagination.totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
