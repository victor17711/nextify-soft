import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, StickyNote, Search } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const colorClasses = {
  default: 'bg-card border-border/50',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
};

const colorLabels = {
  default: 'Implicit',
  yellow: 'Galben',
  green: 'Verde',
  blue: 'Albastru',
  red: 'Roșu'
};

export const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'default'
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes`);
      setNotes(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea notițelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedNote) {
        await axios.put(`${API_URL}/api/notes/${selectedNote.id}`, formData);
        toast.success('Notiță actualizată cu succes!');
      } else {
        await axios.post(`${API_URL}/api/notes`, formData);
        toast.success('Notiță creată cu succes!');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      const message = error.response?.data?.detail || 'Eroare la salvare';
      toast.error(message);
    }
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/notes/${selectedNote.id}`);
      toast.success('Notiță ștearsă cu succes!');
      setDeleteDialogOpen(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      const message = error.response?.data?.detail || 'Eroare la ștergere';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setSelectedNote(null);
    setFormData({
      title: '',
      content: '',
      color: 'default'
    });
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEditNote = (note) => {
    return user?.role === 'admin' || note.created_by === user?.id;
  };

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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Notițe</h1>
          <p className="text-muted-foreground mt-1">Gestionează notițele și ideile</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="active-scale" data-testid="add-note-button">
              <Plus className="w-4 h-4 mr-2" />
              Notiță Nouă
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {selectedNote ? 'Editează Notița' : 'Notiță Nouă'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titlu</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titlul notiței"
                  data-testid="note-title-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conținut</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Scrie conținutul notiței..."
                  data-testid="note-content-input"
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Culoare</Label>
                <Select 
                  value={formData.color} 
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger data-testid="note-color-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            value === 'default' ? 'bg-slate-400' :
                            value === 'yellow' ? 'bg-yellow-400' :
                            value === 'green' ? 'bg-emerald-400' :
                            value === 'blue' ? 'bg-blue-400' :
                            'bg-red-400'
                          }`} />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" className="active-scale" data-testid="note-submit-button">
                  {selectedNote ? 'Salvează' : 'Creează'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6 border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută notițe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="note-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-8 text-center">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nicio notiță găsită</p>
            <p className="text-sm text-muted-foreground mt-1">
              Creează prima ta notiță pentru a începe
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card 
              key={note.id} 
              className={`hover-lift border shadow-sm ${colorClasses[note.color]}`}
              data-testid={`note-card-${note.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-heading line-clamp-1">
                    {note.title}
                  </CardTitle>
                  {canEditNote(note) && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(note)}
                        data-testid={`edit-note-${note.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedNote(note);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-note-${note.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>{note.creator_name}</span>
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirmare Ștergere</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sigur doriți să ștergeți notița <strong>{selectedNote?.title}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-note">
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
