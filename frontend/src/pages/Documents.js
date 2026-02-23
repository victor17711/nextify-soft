import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  FolderPlus, FilePlus, Folder, FileText, Trash2, Download, 
  ChevronRight, Building2, Search, X, File, FileImage, FileSpreadsheet
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return FileImage;
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return FileSpreadsheet;
  return FileText;
};

export const Documents = () => {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedClient, setSelectedClient] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  
  const [folderForm, setFolderForm] = useState({ name: '', client_id: '' });
  const [documentForm, setDocumentForm] = useState({ name: '', file: null });

  useEffect(() => {
    fetchClients();
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchDocuments(selectedFolder.id);
    }
  }, [selectedFolder]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/folders`);
      setFolders(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea folderelor');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (folderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/documents?folder_id=${folderId}`);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea documentelor');
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/folders`, folderForm);
      toast.success('Folder creat cu succes!');
      setFolderDialogOpen(false);
      setFolderForm({ name: '', client_id: '' });
      fetchFolders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la creare folder');
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!documentForm.file || !selectedFolder) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        
        await axios.post(`${API_URL}/api/documents`, {
          name: documentForm.name || documentForm.file.name,
          file_data: base64Data,
          file_type: documentForm.file.type,
          folder_id: selectedFolder.id
        });
        
        toast.success('Document încărcat cu succes!');
        setDocumentDialogOpen(false);
        setDocumentForm({ name: '', file: null });
        fetchDocuments(selectedFolder.id);
      };
      reader.readAsDataURL(documentForm.file);
    } catch (error) {
      toast.error('Eroare la încărcarea documentului');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'folder') {
        await axios.delete(`${API_URL}/api/folders/${deleteItem.id}`);
        toast.success('Folder șters cu succes!');
        if (selectedFolder?.id === deleteItem.id) {
          setSelectedFolder(null);
          setDocuments([]);
        }
        fetchFolders();
      } else {
        await axios.delete(`${API_URL}/api/documents/${deleteItem.id}`);
        toast.success('Document șters cu succes!');
        fetchDocuments(selectedFolder.id);
      }
      setDeleteDialogOpen(false);
      setDeleteItem(null);
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`${API_URL}/api/documents/${doc.id}`);
      const { file_data, file_type, name } = response.data;
      
      const link = document.createElement('a');
      link.href = `data:${file_type};base64,${file_data}`;
      link.download = name;
      link.click();
    } catch (error) {
      toast.error('Eroare la descărcare');
    }
  };

  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === 'all' || folder.client_id === selectedClient;
    return matchesSearch && matchesClient;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Documente</h1>
          <p className="text-muted-foreground mt-1">Gestionează documentele clienților</p>
        </div>
        
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="active-scale" data-testid="add-folder-button">
              <FolderPlus className="w-4 h-4 mr-2" />
              Folder Nou
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Folder Nou</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Nume Folder</Label>
                <Input
                  id="folder-name"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="ex: Contracte 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-client">Client</Label>
                <Select 
                  value={folderForm.client_id} 
                  onValueChange={(value) => setFolderForm({ ...folderForm, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează clientul..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit">Creează</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders Panel */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Foldere
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută foldere..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți clienții</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Folder List */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Se încarcă...</div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Niciun folder găsit
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFolder?.id === folder.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className={`h-4 w-4 ${
                            selectedFolder?.id === folder.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="font-medium truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {folder.document_count || 0}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteType('folder');
                              setDeleteItem(folder);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {folder.client?.company_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Documents Panel */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {selectedFolder ? selectedFolder.name : 'Documente'}
              </CardTitle>
              {selectedFolder && (
                <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="active-scale">
                      <FilePlus className="w-4 h-4 mr-2" />
                      Încarcă
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">Încarcă Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUploadDocument} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-name">Nume Document (opțional)</Label>
                        <Input
                          id="doc-name"
                          value={documentForm.name}
                          onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                          placeholder="Lasă gol pentru numele fișierului"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-file">Fișier</Label>
                        <Input
                          id="doc-file"
                          type="file"
                          onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files[0] })}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                          Anulează
                        </Button>
                        <Button type="submit">Încarcă</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {selectedFolder && (
              <p className="text-sm text-muted-foreground">
                Client: {selectedFolder.client?.company_name}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!selectedFolder ? (
              <div className="text-center text-muted-foreground py-16">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selectează un folder pentru a vedea documentele</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Niciun document în acest folder</p>
                <p className="text-sm mt-1">Încarcă primul document</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.file_type);
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeleteType('document');
                              setDeleteItem(doc);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirmare Ștergere</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sigur doriți să ștergeți {deleteType === 'folder' ? 'folderul' : 'documentul'}{' '}
            <strong>{deleteItem?.name}</strong>?
            {deleteType === 'folder' && (
              <span className="block mt-2 text-destructive text-sm">
                Toate documentele din folder vor fi șterse!
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
