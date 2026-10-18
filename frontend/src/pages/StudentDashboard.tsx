import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { WindowBanner } from '@/components/student/WindowBanner';
import { Badge } from '@/components/ui/Badge';
import { FileUpload } from '@/components/ui/FileUpload';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { User, Lock } from 'lucide-react';

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
  ssc_percentage: string | null;
  hsc_diploma_percentage: string | null;
  cgpa: string | null;
  cooldown: {
    blocked: boolean;
    remainingDays?: number;
    unlocksAt?: number;
  };
}

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
            Confirm & Submit
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
  const [windowOpen, setWindowOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [placementStatus, setPlacementStatus] = useState('unplaced');
  const [company, setCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [ctc, setCtc] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // File state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);
  const [resetPhoto, setResetPhoto] = useState(false);
  const [resetResume, setResetResume] = useState(false);
  const [resetDocuments, setResetDocuments] = useState(false);

  const allFilesSelected = !!photoFile && !!resumeFile && !!documentsFile;
  const someFilesSelected = !!photoFile || !!resumeFile || !!documentsFile;

  const fetchProfile = async () => {
    try {
      const [profileRes, windowRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/admin/window/active'),
      ]);
      const p = profileRes.data.data;
      setProfile(p);
      setWindowOpen(windowRes.data.data.open);
      // Load from server fresh — no localStorage restore
      setPhone(p.phone || '');
      setAddress(p.permanent_address || '');
      setPlacementStatus(p.placement_status || 'unplaced');
      setCompany(p.company_name || '');
      setJobRole(p.job_role || '');
      setCtc(p.ctc_lakhs || '');
      setCgpa(p.cgpa || '');
    } catch {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const canEdit = !profile?.cooldown.blocked || windowOpen;

  const validatePhone = (value: string) => {
    if (value && !/^\d{10}$/.test(value)) {
      setPhoneError('Phone must be exactly 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateCgpa = () => {
    if (!cgpa.trim()) return true;
    const value = parseFloat(cgpa);
    if (Number.isNaN(value) || value < 0 || value > 10) {
      addToast('CGPA must be between 0 and 10', 'error');
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (phone && !validatePhone(phone)) return;
    if (!validateCgpa()) return;

    try {
      await api.patch('/profile/update', {
        phone: phone || undefined,
        permanent_address: address || undefined,
        placement_status: placementStatus,
        company_name: placementStatus === 'placed' ? company : undefined,
        job_role: placementStatus === 'placed' ? jobRole : undefined,
        ctc_lakhs: placementStatus === 'placed' ? parseFloat(ctc) : undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
      });
      addToast('Changes saved. Profile locked for 15 days.', 'success');
      await fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save changes', 'error');
    }
  };

  const handleFinalSubmit = async () => {
    if (phone && !validatePhone(phone)) return;
    if (!validateCgpa()) return;
    try {
      // Step 1: Upload files if selected
      if (photoFile) {
        const form = new FormData();
        form.append('photo', photoFile);
        await api.post('/profile/photo/temp', form);
      }
      if (resumeFile) {
        const form = new FormData();
        form.append('resume', resumeFile);
        await api.post('/profile/resume/temp', form);
      }
      if (documentsFile) {
        const form = new FormData();
        form.append('documents', documentsFile);
        await api.post('/profile/documents/temp', form);
      }

      // Step 2: Submit profile data — this applies cooldown
      await api.post('/profile/submit', {
        phone: phone || undefined,
        permanent_address: address || undefined,
        placement_status: placementStatus,
        company_name: placementStatus === 'placed' ? company : undefined,
        job_role: placementStatus === 'placed' ? jobRole : undefined,
        ctc_lakhs: placementStatus === 'placed' ? parseFloat(ctc) : undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
      });

      addToast('Profile submitted successfully. Locked for 15 days.', 'success');

      // Reset file state
      setPhotoFile(null);
      setResumeFile(null);
      setDocumentsFile(null);
      setResetPhoto(true);
      setResetResume(true);
      setResetDocuments(true);
      setTimeout(() => {
        setResetPhoto(false);
        setResetResume(false);
        setResetDocuments(false);
      }, 100);

      fetchProfile();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Submission failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

        <WindowBanner />

        {/* Cooldown banner */}
        {profile?.cooldown.blocked && !windowOpen && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
            <Lock className="w-4 h-4 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-800">
              Profile locked for <strong>{profile.cooldown.remainingDays} more days</strong>.
              Changes are locked until cooldown expires.
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

        {/* Fixed info */}
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
              { label: 'SSC %', value: profile?.ssc_percentage ? `${profile.ssc_percentage}%` : '—' },
              { label: 'HSC / Diploma %', value: profile?.hsc_diploma_percentage ? `${profile.hsc_diploma_percentage}%` : '—' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Updatable Information
            {!canEdit && <span className="ml-2 text-orange-500 normal-case font-normal">— locked</span>}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Phone <span className="text-muted-foreground/60">(10 digits)</span>
              </label>
              <input
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                  if (phoneError) validatePhone(val);
                }}
                disabled={!canEdit}
                placeholder="10-digit number"
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Placement Status</label>
              <select
                value={placementStatus}
                onChange={(e) => setPlacementStatus(e.target.value)}
                disabled={!canEdit}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!canEdit}
              rows={2}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              CGPA <span className="text-muted-foreground/60">(0 – 10)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                disabled={profile?.cooldown.blocked && !windowOpen}
                placeholder="e.g. 8.70"
                className="h-10 w-40 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (phone && !validatePhone(phone)) return;
              if (!validateCgpa()) return;
              setSaveConfirm(true);
            }}
            disabled={!canEdit}
            className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>

          {placementStatus === 'placed' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Job Role</label>
                <input
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">CTC (Lakhs)</label>
                <input
                  type="number"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Document uploads */}
        {canEdit && (
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document Uploads
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select all three documents. They will be uploaded on final submit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  Photo
                  {profile?.photo_url && <span className="text-green-600 text-xs">✓ uploaded</span>}
                  {photoFile && <span className="text-blue-600 text-xs">✓ selected</span>}
                </p>
                <FileUpload
                  accept="image/jpeg,image/png"
                  maxSizeMB={2}
                  label="Select Photo"
                  hint="JPG or PNG, max 2MB"
                  type="image"
                  onFile={setPhotoFile}
                  reset={resetPhoto}
                />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  Resume
                  {profile?.resume_url && (
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs hover:underline">✓ view</a>
                  )}
                  {resumeFile && <span className="text-blue-600 text-xs">✓ selected</span>}
                </p>
                <FileUpload
                  accept="application/pdf"
                  maxSizeMB={5}
                  label="Select Resume"
                  hint="PDF only, max 5MB"
                  type="pdf"
                  onFile={setResumeFile}
                  reset={resetResume}
                />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  Documents
                  {profile?.documents_url && (
                    <a href={profile.documents_url} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs hover:underline">✓ view</a>
                  )}
                  {documentsFile && <span className="text-blue-600 text-xs">✓ selected</span>}
                </p>
                <FileUpload
                  accept="application/pdf"
                  maxSizeMB={10}
                  label="Select Documents"
                  hint="Consolidated PDF, max 10MB"
                  type="pdf"
                  onFile={setDocumentsFile}
                  reset={resetDocuments}
                />
              </div>
            </div>

            {someFilesSelected && !allFilesSelected && (
              <p className="text-xs text-center text-muted-foreground">
                Select all three documents to enable final submit
              </p>
            )}
          </div>
        )}

        {/* Final submit button */}
        {canEdit && (
          <button
            onClick={() => {
              if (phone && !validatePhone(phone)) return;
              setConfirm(true);
            }}
            disabled={someFilesSelected && !allFilesSelected}
            className="h-12 w-full rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Final Submit
          </button>
        )}

      </div>

      {confirm && (
        <ConfirmDialog
          message="Submitting will lock your profile for 15 days. Any selected documents will be uploaded. This cannot be undone. Continue?"
          onConfirm={() => { setConfirm(false); handleFinalSubmit(); }}
          onCancel={() => setConfirm(false)}
        />
      )}

      {saveConfirm && (
        <ConfirmDialog
          message="Saving changes will lock your entire profile for 15 days. This cannot be undone. Continue?"
          onConfirm={() => { setSaveConfirm(false); handleSaveChanges(); }}
          onCancel={() => setSaveConfirm(false)}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}