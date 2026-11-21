import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, LogOut, Loader2, Video, X } from 'lucide-react';
import { wifToNostrKeys } from '@/lib/crypto';
import { signedFetch, explainRefusal } from '@/lib/nip98Fetch';
import { useLanguage } from '@/i18n/LanguageContext';
import lanaLogo from '@/assets/lana-logo.png';

const POST_TYPES = ['FAQ', 'INSTRUCTIONS', 'NEWS', 'PHILOSOPHY', 'PAST EVENTS'] as const;
type PostType = typeof POST_TYPES[number];

interface Post {
  id: number;
  title: string;
  body: string;
  youtube_url: string;
  types: string[];
  language: string;
  author_hex: string;
  created_at: number;
  updated_at: number;
}

/**
 * Every admin call is SIGNED with the admin's key (src/lib/nip98Fetch.ts); the
 * server believes the signature, never a named hex. The key lives in this tab's
 * memory only — nothing is stored — so a reload or Logout means logging in again.
 */
interface AdminSession {
  hex: string;
  privateKeyHex: string;
}

async function readJson(res: Response): Promise<{ code?: string; reason?: string; error?: string; hex?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const Admin = () => {
  const { t } = useLanguage();
  const [session, setSession] = useState<AdminSession | null>(null);
  const hexId = session?.hex ?? null;
  const [wif, setWif] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formYoutube, setFormYoutube] = useState('');
  const [formTypes, setFormTypes] = useState<string[]>([]);
  const [formLang, setFormLang] = useState<'en' | 'sl'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  // Before 21 Nov 2026 the page kept the admin's hex in localStorage and the
  // server believed it. Nothing is kept now; clear what an old visit left.
  useEffect(() => {
    try { localStorage.removeItem('admin_hex'); } catch { /* storage blocked */ }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!hexId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setIsLoading(false);
    }
  }, [hexId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const keys = await wifToNostrKeys(wif.trim());
      // Logging in = signing one request; 200 proves this key is on the roster.
      const res = await signedFetch('/api/admin/whoami', { method: 'GET' }, keys.privateKeyHex);
      const data = await readJson(res);
      if (!res.ok || data?.hex !== keys.hex) {
        setLoginError(explainRefusal(data));
        return;
      }
      setWif('');
      setSession({ hex: keys.hex, privateKeyHex: keys.privateKeyHex });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid WIF key');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setPosts([]);
    setActionError('');
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormBody('');
    setFormYoutube('');
    setFormTypes([]);
    setFormLang('en');
  };

  const handleEdit = (post: Post) => {
    setEditingId(post.id);
    setFormTitle(post.title);
    setFormBody(post.body);
    setFormYoutube(post.youtube_url);
    setFormTypes(post.types);
    setFormLang(post.language as 'en' | 'sl');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSaving(true);
    setActionError('');
    try {
      const payload = { title: formTitle, body: formBody, youtube_url: formYoutube, types: formTypes, language: formLang };
      const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts';
      const method = editingId ? 'PUT' : 'POST';
      const res = await signedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, session.privateKeyHex);
      if (!res.ok) {
        // Keep the form as it is, so nothing typed is lost.
        const data = await readJson(res);
        setActionError(data?.code ? explainRefusal(data) : (data?.error || `Saving failed (${res.status}).`));
        return;
      }
      resetForm();
      fetchPosts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Saving failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!session || !confirm('Are you sure you want to delete this post?')) return;
    setActionError('');
    try {
      const res = await signedFetch(`/api/admin/posts/${id}`, { method: 'DELETE' }, session.privateKeyHex);
      if (!res.ok) {
        const data = await readJson(res);
        setActionError(data?.code ? explainRefusal(data) : (data?.error || `Deleting failed (${res.status}).`));
        return;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Deleting failed.');
      return;
    }
    fetchPosts();
  };

  const toggleType = (type: string) => {
    setFormTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // ── Login screen ──
  if (!hexId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={lanaLogo}
              alt="Lana"
              className="w-16 h-16 mx-auto mb-4 rounded"
              />
            <h1 className="text-2xl font-display font-bold text-primary">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">LanaPays.Us</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">LANA WIF Private Key</label>
              <input
                type="password"
                value={wif}
                onChange={e => setWif(e.target.value)}
                placeholder="Enter your WIF key..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoggingIn ? 'Verifying...' : 'Log in'}
            </button>
            <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to LanaPays.Us
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ──
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-primary font-display font-bold text-base sm:text-xl hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Admin Panel</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{hexId.slice(0, 8)}...</span>
          <button onClick={handleLogout} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-foreground">Posts</h2>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>

        {actionError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}

        {/* Post Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">{editingId ? 'Edit Post' : 'New Post'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Body</label>
              <textarea
                value={formBody}
                onChange={e => setFormBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">YouTube Link (optional)</label>
              <input
                type="url"
                value={formYoutube}
                onChange={e => setFormYoutube(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type (select one or more)</label>
              <div className="flex flex-wrap gap-2">
                {POST_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      formTypes.includes(type)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Language</label>
              <div className="flex gap-2">
                {(['en', 'sl'] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setFormLang(l)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      formLang === l
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l === 'en' ? 'EN' : 'SI'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Publish Post'}
            </button>
          </form>
        )}

        {/* Posts list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No posts yet. Create your first post!</div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-card border border-border rounded-xl p-3 sm:p-5 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                        {post.language.toUpperCase()}
                      </span>
                      {post.types.map(type => (
                        <span key={type} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                          {type}
                        </span>
                      ))}
                      {post.youtube_url && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                          <Video className="w-3 h-3" /> YouTube
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-foreground">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.created_at * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
