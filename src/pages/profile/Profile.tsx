import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';
import { type Employee } from '../../types/employee';
import { getUserRoleId } from '../../types/user';
import './Profile.css';

export default function Profile() {
  const { user, login } = useAuthStore();
  const { showToast } = useToast();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'account' | 'employee'>('account');

  // Account State
  const [name, setName] = useState(user?.name || '');
  const [nip, setNip] = useState(user?.nip || '');
  const [password, setPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Employee State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setNip(user.nip);
      fetchEmployeeData(user.nip);
    }
  }, [user]);

  const fetchEmployeeData = async (userNip: string) => {
    if (!userNip) return;
    setLoadingEmployee(true);
    try {
      // Cari data pegawai berdasarkan NIP
      const res = await employeeService.list({ search: userNip });
      const found = res.data.data.find((e) => e.nip === userNip);
      if (found) {
        setEmployee(found);
      }
    } catch (err) {
      console.error('Gagal memuat data pegawai', err);
    } finally {
      setLoadingEmployee(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingAccount(true);
    try {
      const payload: any = { name, nip };
      if (password.trim()) {
        payload.password = password;
      }
      
      const res = await userService.update(user.id, payload);
      // Update local storage with new user info
      login(localStorage.getItem('token') || '', res.data);
      
      showToast('Profil akun berhasil diperbarui', 'success');
      setPassword('');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal memperbarui profil akun';
      showToast(msg, 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    // Validasi gambar
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }

    setSavingSignature(true);
    try {
      const formData = new FormData();
      // Mengirim beberapa field yang diwajibkan oleh update employee (jika backend membutuhkannya)
      formData.append('full_name', employee.full_name);
      formData.append('nip', employee.nip);
      if (employee.employee_type_id) formData.append('employee_type_id', String(employee.employee_type_id));
      if (employee.work_unit_id) formData.append('work_unit_id', String(employee.work_unit_id));
      
      // Lampirkan tanda tangan
      formData.append('signature', file);

      await employeeService.update(employee.id, formData);
      showToast('Tanda tangan berhasil diperbarui', 'success');
      // Refresh employee data
      fetchEmployeeData(nip);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal mengunggah tanda tangan. Pastikan Anda memiliki akses.';
      showToast(msg, 'error');
    } finally {
      setSavingSignature(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const roleString = user?.roles?.[0]?.role || '';
  const roleName = roleString === 'super_admin' ? 'Super Admin' : roleString === 'sekretaris' ? 'Sekretaris' : 'Karyawan';
  const roleClass = roleString === 'super_admin' ? 'admin' : roleString === 'sekretaris' ? 'sekretaris' : 'karyawan';

  return (
    <div className="profile-container">
      {/* Header Profile */}
      <div className="profile-header-card">
        <div className="profile-avatar">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info-header">
          <h2>{user?.name}</h2>
          <p className="profile-nip">NIP. {user?.nip}</p>
          <span className={`profile-badge ${roleClass}`}>{roleName}</span>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          Pengaturan Akun
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2V8c0-1.11.89-2 2-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
          </svg>
          Data Kepegawaian
        </button>
      </div>

      <div className="profile-content">
        
        {/* TAB: PENGATURAN AKUN */}
        {activeTab === 'account' && (
          <form className="profile-form" onSubmit={handleAccountSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Masukkan nama lengkap"
                required 
              />
            </div>

            <div className="form-group">
              <label>NIP (Kredensial Login)</label>
              <input 
                type="text" 
                value={nip} 
                onChange={e => setNip(e.target.value)} 
                placeholder="Masukkan NIP"
                required 
              />
            </div>

            <div className="form-group">
              <label>Kata Sandi Baru</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Kosongkan jika tidak ingin mengubah" 
              />
              <small className="help-text">Isi hanya jika Anda ingin mengganti kata sandi. Kata sandi ini digunakan untuk login berikutnya.</small>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn-save" disabled={savingAccount}>
                {savingAccount ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
            </div>
          </form>
        )}

        {/* TAB: DATA KEPEGAWAIAN */}
        {activeTab === 'employee' && (
          <div className="employee-data-container">
            {loadingEmployee ? (
              <div className="employee-loading">Memuat data kepegawaian...</div>
            ) : !employee ? (
              <div className="employee-not-found">
                Data kepegawaian tidak ditemukan untuk NIP <strong>{user?.nip}</strong>.
                <br/>
                Silakan hubungi administrator untuk menyinkronkan data profil Anda.
              </div>
            ) : (
              <>
                <div className="employee-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Nama Lengkap (Data Pegawai)</span>
                    <span className="detail-value">{employee.full_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">NIP</span>
                    <span className="detail-value">{employee.nip}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Jabatan</span>
                    <span className="detail-value">{employee.employee_type?.employee_type || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Unit Kerja</span>
                    <span className="detail-value">{employee.work_unit?.work_unit || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Pribadi/Kantor</span>
                    <span className="detail-value">{employee.email || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nomor Telepon</span>
                    <span className="detail-value">{employee.phone || '-'}</span>
                  </div>
                </div>

                <hr className="profile-divider" />

                <div className="signature-section">
                  <h3>Tanda Tangan Digital</h3>
                  <p className="help-text">Tanda tangan ini akan muncul otomatis pada laporan rapat yang diekspor ke PDF jika Anda bertindak sebagai notulen atau penandatangan.</p>
                  
                  <div className="signature-preview-box">
                    {employee.signature_url ? (
                      <img src={employee.signature_url} alt="Tanda Tangan" className="signature-img" />
                    ) : (
                      <div className="no-signature">Belum ada tanda tangan</div>
                    )}
                  </div>

                  <div className="signature-upload-actions">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleSignatureUpload}
                    />
                    <button 
                      className="btn-upload" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={savingSignature}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                      </svg>
                      {savingSignature ? 'Mengunggah...' : 'Unggah Tanda Tangan (.png)'}
                    </button>
                    <small className="help-text-inline">Disarankan menggunakan file gambar dengan latar belakang transparan.</small>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
