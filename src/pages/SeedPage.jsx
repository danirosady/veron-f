import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { masterAPI } from '@/api/master';
import { SEED_TEMPLATES } from '@/utils/unitTypeSeedData';
import Button from '@/components/ui/Button';

export default function SeedPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // idle | loading | success | error
  const [results, setResults] = useState([]);  // [{unit_type, ok, error}]

  const handleSeed = async () => {
    setPhase('loading');
    setResults([]);

    const outcomes = [];
    for (const template of SEED_TEMPLATES) {
      try {
        await masterAPI.createUnitType(template);
        outcomes.push({ unit_type: template.unit_type, ok: true });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Unknown error';
        outcomes.push({ unit_type: template.unit_type, ok: false, error: msg });
      }
    }

    setResults(outcomes);
    const allOk = outcomes.every((r) => r.ok);
    setPhase(allOk ? 'success' : 'error');
  };

  const handleGoToTemplates = () => {
    navigate('/unit-types');
  };

  const handleRetry = () => {
    setPhase('idle');
    setResults([]);
  };

  const okCount = results.filter((r) => r.ok).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Unit Type Template Seeder</h1>
              <p className="text-primary-200 text-xs mt-0.5">
                Seed 4 vehicle tyre position templates
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {phase === 'idle' && (
            <>
              <p className="text-sm text-gray-600 mb-5">
                This will create <strong>4 unit type templates</strong> with chassis background images and placeholder tyre positions.
              </p>

              <div className="space-y-2 mb-6">
                {SEED_TEMPLATES.map((t) => (
                  <div key={t.unit_type} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-xs font-mono font-semibold text-gray-700">{t.unit_type}</span>
                      <span className="text-xs text-gray-400 ml-2">{t.display_name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{t.max_position} positions</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleSeed} className="w-full">
                <Database className="w-4 h-4" />
                Seed 4 Templates
              </Button>
            </>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500">Creating templates...</p>
            </div>
          )}

          {(phase === 'success' || phase === 'error') && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${phase === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {phase === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${phase === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {phase === 'success' ? `All ${okCount} templates created!` : `${okCount}/${SEED_TEMPLATES.length} templates created`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Some templates may already exist and were skipped.</p>
                </div>
              </div>

              {/* Per-template results */}
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.unit_type} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${r.ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                    {r.ok
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    }
                    <span className="font-mono font-semibold text-gray-700">{r.unit_type}</span>
                    {r.error && <span className="text-red-500 ml-auto truncate">{r.error}</span>}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  Retry
                </Button>
                <Button onClick={handleGoToTemplates} className="flex-1">
                  Open Templates
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            After seeding, open each template to reposition tyres over the chassis image.
            Positions here are auto-generated placeholders — drag each tyre to its correct spot and save.
          </p>
        </div>
      </div>
    </div>
  );
}
