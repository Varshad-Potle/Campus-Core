import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/Badge';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Building2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Company {
  id: number;
  name: string;
  description: string | null;
  visit_date: string | null;
  application_deadline: string | null;
  ctc_lakhs: string | null;
  internship_offered: boolean;
  internship_paid: boolean | null;
  internship_stipend: string | null;
  internship_duration_months: number | null;
  ppo_opportunity: boolean;
  service_bond_months: number | null;
  service_bond_amount: string | null;
  min_ssc_percentage: string | null;
  min_hsc_percentage: string | null;
  min_cgpa: string | null;
  note: string | null;
  is_eligible: boolean;
  ineligibility_reason: string | null;
  application_id: number | null;
  application_status: string | null;
  applied_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  applied:     { label: 'Applied',     variant: 'neutral' },
  shortlisted: { label: 'Shortlisted', variant: 'warning' },
  interview:   { label: 'Interview',   variant: 'warning' },
  selected:    { label: 'Selected',    variant: 'success' },
  rejected:    { label: 'Rejected',    variant: 'danger'  },
};

function CompanyCard({
  company,
  onApply,
  applying,
}: {
  company: Company;
  onApply: (id: number) => void;
  applying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const applied = !!company.application_id;
  const deadlinePassed = !!(
    company.application_deadline && new Date() > new Date(company.application_deadline)
  );
  const statusCfg = company.application_status ? STATUS_CONFIG[company.application_status] : null;

  return (
    <div className={`bg-card border rounded-3xl p-5 flex flex-col gap-3 transition-all ${
      !company.is_eligible ? 'opacity-70' : ''
    } border-border`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{company.name}</h3>
            {company.visit_date && (
              <p className="text-xs text-muted-foreground">
                Visit: {new Date(company.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusCfg && <Badge label={statusCfg.label} variant={statusCfg.variant} />}
          {!applied && company.is_eligible && (
            <button
              onClick={() => onApply(company.id)}
              disabled={applying || deadlinePassed}
              className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applying ? 'Applying…' : 'Apply'}
            </button>
          )}
          {!applied && !company.is_eligible && (
            <span className="text-xs text-muted-foreground italic">{company.ineligibility_reason}</span>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap gap-2">
        {company.ctc_lakhs && (
          <Badge label={`₹${company.ctc_lakhs}L CTC`} variant="success" />
        )}
        {company.internship_offered && (
          <Badge
            label={company.internship_paid ? `Internship · ₹${company.internship_stipend}/mo` : 'Internship (unpaid)'}
            variant="neutral"
          />
        )}
        {company.ppo_opportunity && <Badge label="PPO" variant="warning" />}
        {company.service_bond_months && (
          <Badge label={`Bond: ${company.service_bond_months}mo`} variant="neutral" />
        )}
        {company.application_deadline && (
          <Badge
            label={deadlinePassed
              ? 'Deadline passed'
              : `Deadline: ${new Date(company.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${new Date(company.application_deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            variant={deadlinePassed ? 'danger' : 'warning'}
          />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Less details' : 'More details'}
      </button>

      {expanded && (
        <div className="border-t border-border pt-3 flex flex-col gap-3">
          {company.description && (
            <p className="text-xs text-muted-foreground">{company.description}</p>
          )}

          {/* Eligibility criteria */}
          {(company.min_ssc_percentage || company.min_hsc_percentage || company.min_cgpa) && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">Eligibility Criteria</p>
              <div className="flex flex-wrap gap-2">
                {company.min_ssc_percentage && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-lg">SSC ≥ {company.min_ssc_percentage}%</span>
                )}
                {company.min_hsc_percentage && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-lg">HSC ≥ {company.min_hsc_percentage}%</span>
                )}
                {company.min_cgpa && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-lg">CGPA ≥ {company.min_cgpa}</span>
                )}
              </div>
            </div>
          )}

          {/* Internship details */}
          {company.internship_offered && company.internship_duration_months && (
            <p className="text-xs text-muted-foreground">
              Internship duration: <span className="text-foreground font-medium">{company.internship_duration_months} months</span>
            </p>
          )}

          {/* Service bond */}
          {company.service_bond_months && (
            <p className="text-xs text-muted-foreground">
              Service bond: <span className="text-foreground font-medium">{company.service_bond_months} months</span>
              {company.service_bond_amount && ` · ₹${company.service_bond_amount}`}
            </p>
          )}

          {/* Note */}
          {company.note && (
            <p className="text-xs bg-muted/50 rounded-xl px-3 py-2 text-muted-foreground">{company.note}</p>
          )}

          {/* Applied at */}
          {company.applied_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Applied {new Date(company.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentCompanies() {
  const { toasts, addToast, removeToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data.data);
    } catch {
      addToast('Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleApply = async (companyId: number) => {
    setApplying(companyId);
    try {
      await api.post(`/companies/${companyId}/apply`);
      addToast('Application submitted!', 'success');
      fetchCompanies();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to apply', 'error');
    } finally {
      setApplying(null);
    }
  };

  const eligible   = companies.filter(c => c.is_eligible && !c.application_id);
  const applied    = companies.filter(c => !!c.application_id);
  const ineligible = companies.filter(c => !c.is_eligible && !c.application_id);

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

        <div>
          <h1 className="text-2xl font-bold text-foreground">Campus Recruitment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {eligible.length} eligible · {applied.length} applied · {ineligible.length} ineligible
          </p>
        </div>

        {/* Eligible companies */}
        {eligible.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Eligible to Apply
            </p>
            {eligible.map(c => (
              <CompanyCard key={c.id} company={c} onApply={handleApply} applying={applying === c.id} />
            ))}
          </section>
        )}

        {/* Applied companies */}
        {applied.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> My Applications
            </p>
            {applied.map(c => (
              <CompanyCard key={c.id} company={c} onApply={handleApply} applying={applying === c.id} />
            ))}
          </section>
        )}

        {/* Ineligible companies */}
        {ineligible.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" /> Not Eligible
            </p>
            {ineligible.map(c => (
              <CompanyCard key={c.id} company={c} onApply={handleApply} applying={applying === c.id} />
            ))}
          </section>
        )}

        {companies.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No companies listed yet.
          </div>
        )}

      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}