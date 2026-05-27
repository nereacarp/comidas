import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHouseholdsApi } from '../../api/households';
import { apiClient } from '../../api/client';
import { routes } from '../../lib/routes';
import { getSectionSoftBtnClass } from '../../lib/section-accents';
import { ConfirmPhraseModal } from './ConfirmPhraseModal';

const householdsApi = createHouseholdsApi(apiClient);
const SETTINGS_SOFT_BTN = getSectionSoftBtnClass(routes.settings);

interface DeleteHouseholdSectionProps {
  householdId: string;
  householdName: string;
  onDeleted: () => Promise<void>;
}

export function DeleteHouseholdSection({
  householdId,
  householdName,
  onDeleted,
}: Readonly<DeleteHouseholdSectionProps>) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await householdsApi.delete(householdId);
      setModalOpen(false);
      await onDeleted();
      navigate(routes.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el hogar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="card p-6 border-[color-mix(in_oklab,var(--danger)_35%,var(--border-subtle))]">
        <h3 className="type-display-sm mb-2 text-[var(--danger-text)]">Eliminar hogar</h3>
        <p className="type-hint mb-4">
          Se borrarán las recetas, el plan de comidas, la despensa y las listas de la compra de{' '}
          <strong className="text-ink">{householdName}</strong> para todos los miembros. Esta acción no
          se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className={`${SETTINGS_SOFT_BTN} btn-danger-soft !px-4 !py-2.5`}
        >
          Eliminar hogar
        </button>
      </section>

      <ConfirmPhraseModal
        isOpen={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        title="Eliminar hogar"
        description={(
          <>
            <p>
              Vas a eliminar <strong>{householdName}</strong> y todos sus datos compartidos.
            </p>
            <p>Los demás miembros perderán el acceso de inmediato.</p>
          </>
        )}
        expectedPhrase={householdName}
        phraseLabel={`Escribe «${householdName}» para confirmar`}
        confirmLabel="Eliminar hogar"
        busy={busy}
        error={error}
        onConfirm={handleConfirm}
      />
    </>
  );
}
