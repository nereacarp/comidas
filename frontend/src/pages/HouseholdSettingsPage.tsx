import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHouseholdsApi } from '../api/households';
import { createHouseholdInvitationsApi } from '../api/household-invitations';
import { createTagsApi } from '../api/tags';
import { createStorageLocationsApi } from '../api/storage-locations';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/auth.store';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { routes } from '../lib/routes';
import { getSectionBtnClass, getSectionSoftBtnClass } from '../lib/section-accents';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);
const SETTINGS_SOFT_BTN = getSectionSoftBtnClass(routes.settings);
import { PageHeader } from '../components/ui/PageHeader';
import { SidebarUserFooter } from '../components/SidebarUserFooter';
import { ColorPicker } from '../components/ui/ColorPicker';
import { StorageLocationIconPicker } from '../components/pantry/StorageLocationIconPicker';
import { CaloriePreferenceToggle } from '../components/settings/CaloriePreferenceToggle';
import { DeleteAccountSection } from '../components/settings/DeleteAccountSection';
import { DeleteHouseholdSection } from '../components/settings/DeleteHouseholdSection';
import { HouseholdInvitationsSection } from '../components/settings/HouseholdInvitationsSection';
import { HouseholdNameForm } from '../components/settings/HouseholdNameForm';
import { HouseholdMembersSection } from '../components/settings/HouseholdMembersSection';
import { HouseholdSwitcherSection } from '../components/settings/HouseholdSwitcherSection';
import { EditableTagRow } from '../components/settings/EditableTagRow';
import { EditableLocationRow } from '../components/settings/EditableLocationRow';
import { AppearanceSection } from '../components/settings/AppearanceSection';
import { APP_PALETTE } from '../lib/app-palette';
import { COLOR_PICKER_PRESETS } from '../lib/color-picker-presets';
import {
  getDefaultColorForIcon,
  type StorageLocationIconId,
} from '../lib/storage-location-icons';
import { pantryColorForNewLocation } from '../lib/pantry-location-colors';
import { SETTINGS_PANTRY_LOCATIONS_HASH } from '../lib/settings-sections';
import { resolveLocationColor } from '../utils/color-styles';
import type { HouseholdInvitation, Tag, StorageLocation } from '../types';

const householdsApi = createHouseholdsApi(apiClient);
const invitationsApi = createHouseholdInvitationsApi(apiClient);
const tagsApi = createTagsApi(apiClient);
const locationsApi = createStorageLocationsApi(apiClient);

export function HouseholdSettingsPage() {
  const householdId = useHouseholdId();
  const { household, canEdit, refreshHousehold, reloadHousehold } = useHousehold();
  const [sentInvitations, setSentInvitations] = useState<HouseholdInvitation[]>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(COLOR_PICKER_PRESETS[0].hex);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationIcon, setNewLocationIcon] = useState<StorageLocationIconId>('cabinet');
  const [newLocationColor, setNewLocationColor] = useState(() => pantryColorForNewLocation(0));
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState<string>(APP_PALETTE.brand);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLocationIcon, setEditLocationIcon] = useState<StorageLocationIconId>('cabinet');
  const [editLocationColor, setEditLocationColor] = useState(() => getDefaultColorForIcon('cabinet'));
  const [savingResourceId, setSavingResourceId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleLocationIconChange = (iconId: StorageLocationIconId) => {
    setNewLocationIcon(iconId);
  };

  useEffect(() => {
    if (!householdId) return;
    Promise.all([
      tagsApi.list(householdId),
      locationsApi.list(householdId),
    ])
      .then(([t, locs]) => {
        setTags(t);
        setStorageLocations(locs);
        setNewLocationColor(pantryColorForNewLocation(locs.length));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar ajustes');
      })
      .finally(() => setIsLoading(false));
  }, [householdId, navigate]);

  useEffect(() => {
    if (isLoading) return;
    if (window.location.hash !== `#${SETTINGS_PANTRY_LOCATIONS_HASH}`) return;
    document.getElementById(SETTINGS_PANTRY_LOCATIONS_HASH)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [isLoading]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !newMemberEmail.trim()) return;
    setError('');
    try {
      await householdsApi.addMember(householdId, { email: newMemberEmail.trim() });
      setNewMemberEmail('');
      await loadSentInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir miembro');
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!householdId) return;
    await invitationsApi.cancel(householdId, invitationId);
    await loadSentInvitations();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!householdId) return;
    if (!window.confirm('¿Eliminar este miembro?')) return;
    await householdsApi.removeMember(householdId, userId);
    await refreshHousehold();
  };

  const handleRoleChange = async (userId: string, role: 'EDITOR' | 'VIEWER') => {
    if (!householdId) return;
    setError('');
    try {
      await householdsApi.updateMemberRole(householdId, userId, role);
      await refreshHousehold();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol');
    }
  };

  const handleSaveHouseholdName = async (name: string) => {
    if (!householdId) return;
    setError('');
    try {
      await householdsApi.update(householdId, { name });
      await refreshHousehold();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el nombre';
      setError(message);
      throw err;
    }
  };

  const handleLeaveHousehold = async () => {
    if (!householdId) return;
    if (!window.confirm('¿Seguro que quieres salir de este hogar? Perderás acceso a sus recetas y planes.')) return;
    try {
      await householdsApi.leaveHousehold(householdId);
      await reloadHousehold();
      navigate(routes.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al salir del hogar');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !newTagName.trim()) return;
    try {
      await tagsApi.create(householdId, { name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      const updated = await tagsApi.list(householdId);
      setTags(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tag');
    }
  };

  const isOwner = household?.members?.some(
    (m) => m.user.id === user?.id && m.role === 'OWNER'
  );

  const loadSentInvitations = useCallback(async () => {
    if (!householdId || !isOwner) {
      setSentInvitations([]);
      return;
    }
    try {
      const invites = await invitationsApi.listForHousehold(householdId);
      setSentInvitations(invites);
    } catch {
      setSentInvitations([]);
    }
  }, [householdId, isOwner]);

  useEffect(() => {
    void loadSentInvitations();
  }, [loadSentInvitations]);

  const handleDeleteTag = async (tagId: string) => {
    if (!householdId) return;
    if (editingTagId === tagId) setEditingTagId(null);
    await tagsApi.delete(householdId, tagId);
    const updated = await tagsApi.list(householdId);
    setTags(updated);
  };

  const startEditTag = (tag: Tag) => {
    setEditingLocationId(null);
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || COLOR_PICKER_PRESETS[0].hex);
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
  };

  const saveEditTag = async () => {
    if (!householdId || !editingTagId || !editTagName.trim()) return;
    setSavingResourceId(editingTagId);
    setError('');
    try {
      await tagsApi.update(householdId, editingTagId, {
        name: editTagName.trim(),
        color: editTagColor,
      });
      setTags(await tagsApi.list(householdId));
      cancelEditTag();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tag');
    } finally {
      setSavingResourceId(null);
    }
  };

  const handleTagColorConfirm = async (tagId: string, color: string) => {
    if (!householdId) return;
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    setSavingResourceId(tagId);
    setError('');
    try {
      await tagsApi.update(householdId, tagId, { name: tag.name, color });
      setTags(await tagsApi.list(householdId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar color');
    } finally {
      setSavingResourceId(null);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !newLocationName.trim()) return;
    try {
      await locationsApi.create(householdId, {
        name: newLocationName.trim(),
        icon: newLocationIcon,
        color: resolveLocationColor(newLocationIcon, newLocationColor),
      });
      const updated = await locationsApi.list(householdId);
      setStorageLocations(updated);
      setNewLocationName('');
      setNewLocationIcon('cabinet');
      setNewLocationColor(pantryColorForNewLocation(updated.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ubicacion');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!householdId) return;
    if (editingLocationId === locationId) setEditingLocationId(null);
    await locationsApi.delete(householdId, locationId);
    setStorageLocations(await locationsApi.list(householdId));
  };

  const startEditLocation = (loc: StorageLocation) => {
    setEditingTagId(null);
    const iconId = (loc.icon as StorageLocationIconId) || 'cabinet';
    setEditingLocationId(loc.id);
    setEditLocationName(loc.name);
    setEditLocationIcon(iconId);
    setEditLocationColor(resolveLocationColor(iconId, loc.color));
  };

  const cancelEditLocation = () => {
    setEditingLocationId(null);
  };

  const saveEditLocation = async () => {
    if (!householdId || !editingLocationId || !editLocationName.trim()) return;
    setSavingResourceId(editingLocationId);
    setError('');
    try {
      await locationsApi.update(householdId, editingLocationId, {
        name: editLocationName.trim(),
        icon: editLocationIcon,
        color: resolveLocationColor(editLocationIcon, editLocationColor),
      });
      setStorageLocations(await locationsApi.list(householdId));
      cancelEditLocation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar ubicacion');
    } finally {
      setSavingResourceId(null);
    }
  };

  const handleLocationColorConfirm = async (locationId: string, color: string) => {
    if (!householdId) return;
    const loc = storageLocations.find((l) => l.id === locationId);
    if (!loc) return;
    setSavingResourceId(locationId);
    setError('');
    try {
      await locationsApi.update(householdId, locationId, {
        name: loc.name,
        icon: loc.icon ?? undefined,
        color: resolveLocationColor(loc.icon ?? 'cabinet', color),
      });
      setStorageLocations(await locationsApi.list(householdId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar color');
    } finally {
      setSavingResourceId(null);
    }
  };

  if (isLoading) return <p className="loading-text">Cargando...</p>;
  if (!household) return null;

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Ajustes del hogar" />

      <AppearanceSection />

      <HouseholdInvitationsSection />
      <HouseholdSwitcherSection />

      <div className="md:hidden">
        <SidebarUserFooter
          name={user?.name}
          email={user?.email}
          onLogout={logout}
        />
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="card p-6">
        <h3 className="type-display-sm mb-4">Nombre del hogar</h3>
        <HouseholdNameForm
          name={household.name}
          canEdit={canEdit}
          onSave={handleSaveHouseholdName}
        />
      </section>

      <section className="card p-6">
        <h3 className="type-display-sm mb-2">Tu cuenta</h3>
        <p className="text-sm text-muted mb-4">
          Preferencias personales. No afectan al resto del hogar.
        </p>
        <CaloriePreferenceToggle id="show-calories-settings" />
        <DeleteAccountSection />
      </section>

      <HouseholdMembersSection
        members={household.members}
        pendingInvites={sentInvitations}
        currentUserId={user?.id}
        isOwner={!!isOwner}
        newMemberEmail={newMemberEmail}
        onNewMemberEmailChange={setNewMemberEmail}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onRoleChange={handleRoleChange}
        onCancelInvite={isOwner ? handleCancelInvite : undefined}
      />

      <section className="card p-6">
        <h3 className="type-display-sm mb-4">Tags</h3>
        {tags.length > 0 && (
          <div className="space-y-2 mb-4">
            {tags.map((tag) => (
              <EditableTagRow
                key={tag.id}
                name={tag.name}
                color={tag.color || COLOR_PICKER_PRESETS[0].hex}
                isEditing={editingTagId === tag.id}
                editName={editTagName}
                editColor={editTagColor}
                onEditNameChange={setEditTagName}
                onEditColorChange={setEditTagColor}
                onColorConfirm={(color) => handleTagColorConfirm(tag.id, color)}
                onStartEdit={() => startEditTag(tag)}
                onSaveEdit={saveEditTag}
                onCancelEdit={cancelEditTag}
                onDelete={() => handleDeleteTag(tag.id)}
                isSaving={savingResourceId === tag.id}
              />
            ))}
          </div>
        )}
        <form onSubmit={handleAddTag} className="settings-create-row">
          <ColorPicker
            value={newTagColor}
            onChange={setNewTagColor}
            label="Color del tag"
          />
          <input
            type="text"
            placeholder="Nombre del tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="input settings-create-row__input"
          />
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className={`${SETTINGS_BTN} settings-create-row__submit disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Crear
          </button>
        </form>
      </section>

      <section id={SETTINGS_PANTRY_LOCATIONS_HASH} className="card p-6 scroll-mt-24">
        <h3 className="type-display-sm mb-4">Ubicaciones de despensa</h3>
        {storageLocations.length > 0 && (
          <div className="space-y-2 mb-4">
            {storageLocations.map((loc) => (
              <EditableLocationRow
                key={loc.id}
                name={loc.name}
                icon={loc.icon}
                color={loc.color}
                isEditing={editingLocationId === loc.id}
                editName={editLocationName}
                editIcon={editLocationIcon}
                editColor={editLocationColor}
                onEditNameChange={setEditLocationName}
                onEditIconChange={setEditLocationIcon}
                onEditColorChange={setEditLocationColor}
                onColorConfirm={(color) => handleLocationColorConfirm(loc.id, color)}
                onStartEdit={() => startEditLocation(loc)}
                onSaveEdit={saveEditLocation}
                onCancelEdit={cancelEditLocation}
                onDelete={() => handleDeleteLocation(loc.id)}
                isSaving={savingResourceId === loc.id}
              />
            ))}
          </div>
        )}
        <form onSubmit={handleAddLocation} className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Icono</p>
            <StorageLocationIconPicker
              value={newLocationIcon}
              onChange={handleLocationIconChange}
              accentColor={newLocationColor}
            />
          </div>
          <div className="settings-create-row">
            <ColorPicker
              value={newLocationColor}
              onChange={setNewLocationColor}
              label="Color de la ubicacion"
            />
            <input
              type="text"
              placeholder="Nueva ubicación"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="input settings-create-row__input"
            />
            <button
              type="submit"
              disabled={!newLocationName.trim()}
              className={`${SETTINGS_SOFT_BTN} settings-create-row__submit disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Crear
            </button>
          </div>
        </form>
      </section>

      {!isOwner && (
        <section className="card p-6">
          <h3 className="type-display-sm mb-2">Salir del hogar</h3>
          <p className="type-hint mb-4">
            Perderás acceso a las recetas, planes de comida y listas de la compra de este hogar.
          </p>
          <button
            type="button"
            onClick={handleLeaveHousehold}
            className={`${SETTINGS_SOFT_BTN} !px-4 !py-2.5`}
          >
            Salir del hogar
          </button>
        </section>
      )}

      {isOwner && householdId && (
        <DeleteHouseholdSection
          householdId={householdId}
          householdName={household.name}
          onDeleted={reloadHousehold}
        />
      )}

    </div>
  );
}
