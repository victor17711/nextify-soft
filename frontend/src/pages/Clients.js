import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Briefcase, Search, Building2, Phone, Mail, Repeat } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusColors = {
  activ: 'bg-emerald-500',
  inactiv: 'bg-slate-500',
  finalizat: 'bg-blue-500'
};

const statusLabels = {
  activ: 'Activ',
  inactiv: 'Inactiv',
  finalizat: 'Finalizat'
};

const projectTypes = [
  'Dezvoltare Web',
  'Aplicație Mobilă',
  'Design UI/UX',
  'Marketing Digital',
  'Consultanță IT',
  'Mentenanță',
  'E-commerce',
  'Software Custom',
  'Altele'
];

export const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    project_type: '',
    budget: '',
    monthly_fee: '',
    status: 'activ',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`);
      setClients(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea clienților');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        monthly_fee: formData.project_type === 'Mentenanță' && formData.monthly_fee 
          ? parseFloat(formData.monthly_fee) 
          : null
      };
      
      if (selectedClient) {
        await axios.put(`${API_URL}/api/clients/${selectedClient.id}`, submitData);
        toast.success('Client actualizat cu succes!');
      } else {
        await axios.post(`${API_URL}/api/clients`, submitData);
        toast.success('Client creat cu succes!');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      const message = error.response?.data?.detail || 'Eroare la salvare';
      toast.error(message);
    }
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      company_name: client.company_name,
      project_type: client.project_type,
      budget: client.budget.toString(),
      monthly_fee: client.monthly_fee ? client.monthly_fee.toString() : '',
      status: client.status,
      contact_person: client.contact_person || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      notes: client.notes || ''
    });
    setDialogOpen(true);
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/clients/${selectedClient.id}`);
      toast.success('Client șters cu succes!');
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setFormData({
      company_name: '',
      project_type: '',
      budget: '',
      monthly_fee: '',
      status: 'activ',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      notes: ''
    });
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.project_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ro-MD', {
      style: 'currency',
      currency: 'MDL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalBudget = filteredClients.reduce((sum, c) => sum + (c.budget || 0), 0);
  const monthlyRevenue = filteredClients
    .filter(c => c.status === 'activ')
    .reduce((sum, c) => sum + (c.monthly_fee || 0), 0);

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Clienți</h1>
          <p className="text-muted-foreground mt-1">Gestionează portofoliul de clienți</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="active-scale" data-testid="add-client-button">
              <Plus className="w-4 h-4 mr-2" />
              Client Nou
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {selectedClient ? 'Editează Client' : 'Client Nou'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nume Companie (SRL)</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="SC Exemplu SRL"
                  data-testid="client-company-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Tip Proiect</Label>
                <Select 
                  value={formData.project_type} 
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger data-testid="client-project-type-select">
                    <SelectValue placeholder="Selectează..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Section */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="text-sm font-medium">Informații Financiare</h4>
                
                {formData.project_type === 'Mentenanță' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_fee" className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        Sumă Lunară (MDL)
                      </Label>
                      <Input
                        id="monthly_fee"
                        type="number"
                        value={formData.monthly_fee}
                        onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                        placeholder="ex: 2000"
                        data-testid="client-monthly-fee-input"
                      />
                      <p className="text-xs text-muted-foreground">
                        Suma recurentă lunară pentru contract de mentenanță
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Buget Inițial/Total (MDL)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        placeholder="ex: 5000"
                        data-testid="client-budget-input"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Suma inițială sau estimare anuală
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="budget">Buget Proiect (MDL)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="ex: 15000"
                      data-testid="client-budget-input"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Suma totală pentru proiect
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="client-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activ">Activ</SelectItem>
                    <SelectItem value="inactiv">Inactiv</SelectItem>
                    <SelectItem value="finalizat">Finalizat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3">Informații Contact</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Persoană de Contact</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Ion Popescu"
                      data-testid="client-contact-person-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="contact@exemplu.ro"
                        data-testid="client-contact-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Telefon</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="0712345678"
                        data-testid="client-contact-phone-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notițe</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notițe despre client..."
                  data-testid="client-notes-input"
                  rows={3}
                />
              </div>
              
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" className="active-scale" data-testid="client-submit-button">
                  {selectedClient ? 'Salvează' : 'Creează'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clienți</p>
              <p className="text-2xl font-heading font-bold tabular-nums">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Repeat className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Venit Lunar Recurent</p>
              <p className="text-2xl font-heading font-bold tabular-nums">{formatCurrency(monthlyRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <span className="text-xl font-bold text-blue-500">MDL</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buget Total</p>
              <p className="text-xl font-heading font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută clienți..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="client-search-input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48" data-testid="client-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="activ">Activi</SelectItem>
                <SelectItem value="inactiv">Inactivi</SelectItem>
                <SelectItem value="finalizat">Finalizați</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Se încarcă...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Niciun client găsit
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Companie</TableHead>
                  <TableHead className="font-medium">Tip Proiect</TableHead>
                  <TableHead className="font-medium text-right">Buget</TableHead>
                  <TableHead className="font-medium text-right">Lunar</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="font-medium text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    data-testid={`client-row-${client.id}`}
                    onClick={() => handleView(client)}
                  >
                    <TableCell className="font-medium">{client.company_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.project_type}
                        {client.project_type === 'Mentenanță' && (
                          <Repeat className="h-3 w-3 text-emerald-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(client.budget)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.monthly_fee ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(client.monthly_fee)}/lună
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[client.status]} text-white`}>
                        {statusLabels[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.contact_person || '-'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                          data-testid={`edit-client-${client.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedClient(client);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-client-${client.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Client Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedClient?.company_name}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tip Proiect</p>
                  <p className="font-medium flex items-center gap-2">
                    {selectedClient.project_type}
                    {selectedClient.project_type === 'Mentenanță' && (
                      <Repeat className="h-4 w-4 text-emerald-500" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[selectedClient.status]} text-white mt-1`}>
                    {statusLabels[selectedClient.status]}
                  </Badge>
                </div>
              </div>
              
              {/* Financial Info */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                <h4 className="text-sm font-medium">Informații Financiare</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.project_type === 'Mentenanță' ? 'Buget Inițial' : 'Buget Proiect'}
                    </p>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(selectedClient.budget)}</p>
                  </div>
                  {selectedClient.monthly_fee && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sumă Lunară</p>
                      <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(selectedClient.monthly_fee)}/lună
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(selectedClient.contact_person || selectedClient.contact_email || selectedClient.contact_phone) && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-3">Informații Contact</h4>
                  <div className="space-y-2">
                    {selectedClient.contact_person && (
                      <p className="text-sm">{selectedClient.contact_person}</p>
                    )}
                    {selectedClient.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {selectedClient.contact_email}
                      </div>
                    )}
                    {selectedClient.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {selectedClient.contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedClient.notes && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-2">Notițe</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedClient.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Închide
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              handleEdit(selectedClient);
            }} data-testid="edit-from-view-button">
              <Pencil className="h-4 w-4 mr-2" />
              Editează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirmare Ștergere</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sigur doriți să ștergeți clientul <strong>{selectedClient?.company_name}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-client">
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
