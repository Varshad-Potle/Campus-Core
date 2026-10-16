import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { WindowBanner } from '@/components/student/WindowBanner';
import { Badge } from '@/components/ui/Badge';
import { FileUpload } from '@/components/ui/FileUpload';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { User, Lock, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  roll_number: string;
  branch: string;
  parent_name: string;
  year: number;
  phone: string | null;
  permanent_address: string | null;
  photo_url: string | null;
  resume_url: string | null;
  documents_url: string | null;
  placement_status: string;
  company_name: string | null;
  job_role: string | null;
  ctc_lakhs: string | null;
  cooldown: {
    blocked: boolean;
    remainingDays?: number;
    unlocksAt?: number;
  };
}

// Confirm dialog
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-3xl border border-border p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { toasts, addToast, removeToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | { message: string; action: () => void }>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [placementStatus, setPlacementStatus] = useState('unplaced');
  const [company, setCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [ctc, setCtc] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      const p = res.data.data;
      setProfile(p);
      setPhone(p.phone || '');
      setAddress(p.permanent_address || '');
      setPlacementStatus(p.placement_status || 'unplaced');
      setCompany(p.company_name || '');
      setJobRole(p.job_role || '');
      setCtc(p.ctc_lakhs || '');
    } catch {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveProfile = async () => {
    try {
      await api.patch('/profile/update', {
        phone: phone || undefined,
        permanent_address: address || undefined,
        placement_status: placementStatus,
        company_name: placementStatus === 'placed' ? company : undefined,
        job_role: placementStatus === 'placed' ? jobRole : undefined,
        ctc_lakhs: placementStatus === 'placed' ? parseFloat(ctc) : undefined,
      });
      addToast('Profile updated successfully', 'success');
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    const form = new FormData();
    form.append('photo', photoFile);
    try {
      await api.post('/profile/photo', form);
      addToast('Photo uploaded successfully', 'success');
      setPhotoFile(null);
      fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Photo upload failed', 'error');
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    const form = new FormData();
    form.append('resume', resumeFile);
    try {
      await api.post('/profile/resume', form);
      addToast('Resume uploaded successfully', 'success');
      setResumeFile(null);
      fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Resume upload failed', 'error');
    }
  };

  const handleDocumentsUpload = async () => {
    if (!documentsFile) return;
    const form = new FormData();
    form.append('documents', documentsFile);
    try {
      await api.post('/profile/documents', form);
      addToast('Documents uploaded successfully', 'success');
      setDocumentsFile(null);
      fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Documents upload failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const locked = profile?.cooldown.blocked && !editing;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

        <WindowBanner />

        {/* Cooldown banner */}
        {profile?.cooldown.blocked && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
            <Lock className="w-4 h-4 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-800">
              Profile locked for <strong>{profile.cooldown.remainingDays} more days</strong>.
              Changes locked until cooldown expires.
            </p>
          </div>
        )}

        {/* Profile header */}
        <div className="bg-card border border-border rounded-3xl p-6 flex items-start gap-4">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{profile?.name}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge label={`Roll: ${profile?.roll_number}`} variant="neutral" />
              <Badge label={profile?.branch || ''} variant="neutral" />
              <Badge label={`Year ${profile?.year}`} variant="neutral" />
              <Badge
                label={profile?.placement_status === 'placed' ? 'Placed' : 'Unplaced'}
                variant={profile?.placement_status === 'placed' ? 'success' : 'neutral'}
              />
            </div>
          </div>
        </div>

        {/* Non-changeable info */}
        <div className="bg-card border border-border rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Fixed Information
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: profile?.name },
              { label: 'Roll Number', value: profile?.roll_number },
              { label: 'Branch', value: profile?.branch },
              { label: 'Parent Name', value: profile?.parent_name },
              { label: 'Year', value: profile?.year },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editable info */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Updatable Information
            </p>
            {!editing && !profile?.cooldown.blocked && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Placement Status</label>
                  <select
                    value={placementStatus}
                    onChange={(e) => setPlacementStatus(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="unplaced">Unplaced</option>
                    <option value="placed">Placed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Permanent Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {placementStatus === 'placed' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Company</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Job Role</label>
                    <input
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">CTC (Lakhs)</label>
                    <input
                      type="number"
                      value={ctc}
                      onChange={(e) => setCtc(e.target.value)}
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    setConfirm({
                      message: 'Are you sure you want to save changes? Your profile will be locked for 15 days.',
                      action: handleSaveProfile,
                    })
                  }
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="h-10 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Phone', value: profile?.phone || '—' },
                { label: 'Address', value: profile?.permanent_address || '—' },
                { label: 'Company', value: profile?.company_name || '—' },
                { label: 'Job Role', value: profile?.job_role || '—' },
                { label: 'CTC', value: profile?.ctc_lakhs ? `₹${profile.ctc_lakhs}L` : '—' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File uploads */}
        {!locked && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-3xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photo
              </p>
              {profile?.photo_url && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                </div>
              )}
              <FileUpload
                accept="image/jpeg,image/png"
                maxSizeMB={2}
                label="Upload Photo"
                hint="JPG or PNG, max 2MB"
                type="image"
                onFile={setPhotoFile}
              />
              {photoFile && (
                <button
                  onClick={() =>
                    setConfirm({
                      message: 'Upload this photo? Your profile will be locked for 15 days.',
                      action: handlePhotoUpload,
                    })
                  }
                  className="h-9 w-full rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Upload
                </button>
              )}
            </div>

            <div className="bg-card border border-border rounded-3xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resume
              </p>
              {profile?.resume_url && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    View current
                  </a>
                </div>
              )}
              <FileUpload
                accept="application/pdf"
                maxSizeMB={5}
                label="Upload Resume"
                hint="PDF only, max 5MB"
                type="pdf"
                onFile={setResumeFile}
              />
              {resumeFile && (
                <button
                  onClick={() =>
                    setConfirm({
                      message: 'Upload this resume? Your profile will be locked for 15 days.',
                      action: handleResumeUpload,
                    })
                  }
                  className="h-9 w-full rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Upload
                </button>
              )}
            </div>

            <div className="bg-card border border-border rounded-3xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </p>
              {profile?.documents_url && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <a href={profile.documents_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    View current
                  </a>
                </div>
              )}
              <FileUpload
                accept="application/pdf"
                maxSizeMB={10}
                label="Upload Documents"
                hint="Consolidated PDF (10th, 12th, ID), max 10MB"
                type="pdf"
                onFile={setDocumentsFile}
              />
              {documentsFile && (
                <button
                  onClick={() =>
                    setConfirm({
                      message: 'Upload these documents? Your profile will be locked for 15 days.',
                      action: handleDocumentsUpload,
                    })
                  }
                  className="h-9 w-full rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => { confirm.action(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}