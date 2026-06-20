import { useState, useEffect, useCallback } from 'react';
import ActionIcon from '../../components/ui/ActionIcon';
import { employeeTypeManageService } from '../../services/employeeService';
import type { EmployeeType, PaginatedResponse } from '../../types/employee';
import { useToast } from '../../contexts/ToastContext';
import './EmployeeTypeManagement.css';

type EmployeeTypeWithCount = EmployeeType & { employees_count?: number };

export default function EmployeeTypeManagement() {
  const { showToast } = useToast();

  /* State */
  const [employeeTypes, setEmployeeTypes] = useState<PaginatedResponse<EmployeeTypeWithCount> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Filter */
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  /* Modal */
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmployeeTypeWithCount | null>(null);

  /* Form */
  const [formValue, setFormValue] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployeeTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (search) params.search = search;
      const res = await employeeTypeManageService.listPaginated(params);
      setEmployeeTypes(res.data);
    } catch {
      setError('Gagal memuat data jabatan.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchEmployeeTypes(); }, [fetchEmployeeTypes]);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Open Modals */
  const openAddModal = () => {
    setSelectedType(null);
    setFormValue('');
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (type: EmployeeTypeWithCount) => {
    setSelectedType(type);
    setFormValue(type.employee_type);
    setFormError('');
    setShowFormModal(true);
  };

  const openDeleteModal = (type: EmployeeTypeWithCount) => {
    setSelectedType(type);
    setShowDeleteModal(true);
  };

  /* Actions */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) {
      setFormError('Nama jabatan tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      if (selectedType) {
        await employeeTypeManageService.update(selectedType.id, { employee_type: formValue.trim() });
        showToast("Data Jabatan berhasil diubah");
      } else {
        await employeeTypeManageService.store({ employee_type: formValue.trim() });
        showToast("Data Jabatan berhasil ditambahkan");
      }
      setShowFormModal(false);
      fetchEmployeeTypes();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const serverMsg = axErr.response?.data?.errors?.employee_type?.[0]
          || axErr.response?.data?.message
          || 'Gagal menyimpan data.';
        setFormError(serverMsg);
      } else {
        setFormError('Gagal menyimpan data.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedType) return;
    setSaving(true);
    try {
      await employeeTypeManageService.destroy(selectedType.id);
      showToast("Data Jabatan berhasil dihapus");
      setShowDeleteModal(false);
      fetchEmployeeTypes();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setError(axErr.response?.data?.message || 'Gagal menghapus jabatan.');
      } else {
        setError('Gagal menghapus jabatan.');
      }
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
      setSelectedType(null);
    }
  };

  const totalPages = employeeTypes?.last_page || 1;

  /* Row numbering based on pagination */
  const startNo = employeeTypes ? (employeeTypes.current_page - 1) * employeeTypes.per_page : 0;

  return (
    <div className="et-management">
      {/* Header */}
      <div className="et-page-header">
        <div className="et-page-header-text">
          <h1>Manajemen Jabatan</h1>
          <p>Kelola data jabatan RS Citra Husada</p>
        </div>
        <button className="et-add-btn" onClick={openAddModal}>
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Tambah Jabatan
        </button>
      </div>

      {/* Filter */}
      <div className="et-filters">
        <label>Cari Jabatan</label>
        <div className="et-filter-input-wrapper">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input
            type="text"
            placeholder="Cari nama jabatan..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="et-error">{error}</div>}

      {/* Table */}
      <div className="et-table-wrapper">
        {loading ? (
          <div className="et-loading">Memuat data jabatan...</div>
        ) : !employeeTypes || employeeTypes.data.length === 0 ? (
          <div className="et-empty">Tidak ada data jabatan ditemukan.</div>
        ) : (
          <>
            <table className="et-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Nama Jabatan</th>
                  <th>Jumlah Karyawan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employeeTypes.data.map((type, idx) => (
                  <tr key={type.id}>
                    <td className="et-no-cell">{startNo + idx + 1}</td>
                    <td className="et-name-text">{type.employee_type}</td>
                    <td className="et-count-cell">{type.employees_count ?? 0} Karyawan</td>
                    <td>
                      <div className="et-action-group">
                        <button
                          className="et-action-btn edit"
                          title="Edit"
                          onClick={() => openEditModal(type)}
                        >
                          <ActionIcon name="edit" size={18} />
                        </button>
                        <button
                          className="et-action-btn del"
                          title="Hapus"
                          onClick={() => openDeleteModal(type)}
                        >
                          <ActionIcon name="hapus" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="et-pagination">
              <span>Menampilkan {employeeTypes.data.length} dari {employeeTypes.total} jabatan</span>
              <div className="et-pagination-btns">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 1 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => {
                    const isGap = arr[idx - 1] && p - arr[idx - 1] > 1;
                    return (
                      <span key={p}>
                        {isGap && <button disabled>…</button>}
                        <button className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                      </span>
                    );
                  })}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className="et-modal-overlay" onClick={() => !saving && setShowFormModal(false)}>
          <div className="et-modal-box" onClick={e => e.stopPropagation()}>
            <div className="et-modal-header">
              <div>
                <h3>{selectedType ? 'Edit Jabatan' : 'Tambah Jabatan'}</h3>
                <p>{selectedType ? 'Perbarui nama jabatan RS Citra Husada' : 'Masukkan nama jabatan baru RS Citra Husada'}</p>
              </div>
              <button className="et-modal-close" onClick={() => !saving && setShowFormModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="et-modal-body">
                <div className="et-modal-field">
                  <label>Nama Jabatan <span className="et-required">*</span></label>
                  <input
                    type="text"
                    placeholder="Masukkan nama jabatan"
                    value={formValue}
                    onChange={e => { setFormValue(e.target.value); setFormError(''); }}
                    autoFocus
                  />
                  {formError && <div className="et-field-error">{formError}</div>}
                </div>
              </div>
              <div className="et-modal-footer">
                <button
                  type="button"
                  className="et-btn-cancel"
                  onClick={() => setShowFormModal(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="et-btn-submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : selectedType ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="et-modal-overlay" onClick={() => !saving && setShowDeleteModal(false)}>
          <div className="et-delete-modal-box" onClick={e => e.stopPropagation()}>
            <h3>Konfirmasi Hapus Jabatan</h3>
            <p>
              Apakah Anda yakin ingin menghapus jabatan <strong>{selectedType?.employee_type}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="et-delete-actions">
              <button
                className="et-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                className="et-btn-danger"
                onClick={handleDeleteConfirm}
                disabled={saving}
              >
                {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
