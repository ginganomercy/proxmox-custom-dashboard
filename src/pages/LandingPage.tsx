import { useNavigate, Link } from 'react-router-dom';
import logoUrl from '@/assets/logo.svg?url';
import { 
  Server, 
  Activity, 
  Terminal, 
  Shield, 
  Zap, 
  RotateCcw, 
  Cpu, 
  HardDrive, 
  Globe, 
  ChevronRight, 
  ArrowRight,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Cloud Baja Tegal | VPS Akademik Politeknik Baja Tegal";
    const token = Cookies.get('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800 relative overflow-hidden font-sans">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-blue-200/50 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Header/Navbar */}
      <header className="relative z-20 border-b border-slate-100 bg-white/60 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200 bg-transparent flex-shrink-0">
              <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent leading-none">
                Cloud Baja Tegal (CBT)
              </span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                Politeknik Baja Tegal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#tentang" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Tentang CBT</a>
            <a href="#fasilitas" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Fasilitas Lab</a>
            <a href="#preview" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pratinjau Sistem</a>
          </nav>

          {/* Call to Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5"
              >
                Masuk ke Dasbor
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  Masuk
                </Link>
                <Link 
                  to="/register" 
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5"
                >
                  Daftar
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Hamburger Button - Mobile */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-slate-600 hover:text-blue-600 p-2 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-lg px-4 py-6 flex flex-col gap-6 z-50 animate-fade-in-up">
            <nav className="flex flex-col gap-4">
              <a href="#tentang" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-blue-600 transition-colors">Tentang CBT</a>
              <a href="#fasilitas" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-blue-600 transition-colors">Fasilitas Lab</a>
              <a href="#preview" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-blue-600 transition-colors">Pratinjau Sistem</a>
            </nav>
            <div className="border-t border-slate-100 pt-6 flex flex-col gap-3">
              {isLoggedIn ? (
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Masuk ke Dasbor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-center rounded-xl text-sm font-semibold transition-all"
                  >
                    Masuk
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Daftar Sekarang
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow">
        
        {/* Hero Section */}
        <section id="tentang" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6 shadow-sm animate-fade-in-up">
            <Zap className="w-3.5 h-3.5 fill-blue-500" />
            Cerdas, Inovatif, Berkarakter
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight animate-fade-in-up delay-100">
            Virtual Private Server{" "}
            <span className="block mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Politeknik Baja Tegal
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium animate-fade-in-up delay-200">
            Infrastruktur komputasi cerdas dan inovatif (Cloud Baja Tegal) yang dirancang khusus untuk mendukung praktikum, riset, dan pengembangan proyek bagi Civitas Akademika Politeknik Baja Tegal.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link 
              to={isLoggedIn ? "/dashboard" : "/login"} 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all text-base transform hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Masuk ke Dasbor" : "Akses Lab Virtual"}
            </Link>
            <a 
              href="#preview" 
              className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 hover:border-blue-300 font-semibold rounded-2xl transition-all text-base flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Lihat Pratinjau Sistem
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-600 font-medium animate-fade-in-up delay-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Eksklusif Civitas Akademika
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Lingkungan Riset Terisolasi
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Mendukung Inovasi Teknologi
            </div>
          </div>
        </section>

        {/* Visual Preview / Replica Card Section */}
        <section id="preview" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up delay-500">
          <div className="bg-white/80 rounded-3xl p-4 sm:p-6 shadow-xl shadow-blue-900/5 border border-white/80 backdrop-blur-md relative">
            {/* Top bar replica */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-xs font-semibold text-slate-400 ml-2">Pratinjau Antarmuka Konsol</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100/50 rounded-full px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                <span className="text-xs font-medium text-blue-700">Status Server: Optimal</span>
              </div>
            </div>

            {/* Dashboard Mock Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* VM Details Card Mock */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400">VM ID: 400</h4>
                      <h3 className="text-lg font-bold text-slate-800">lab-jaringan-01</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      Berjalan
                    </span>
                  </div>
                  <div className="space-y-3.5 my-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">OS Template</span>
                      <span className="font-semibold text-slate-700">Ubuntu 22.04 LTS</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Alokasi CPU</span>
                      <span className="font-semibold text-slate-700">2 vCPUs</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Penyimpanan</span>
                      <span className="font-semibold text-slate-700">NVMe SSD</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className="text-xs font-semibold text-slate-500">Node: Akademik-1</span>
                </div>
              </div>

              {/* VM Usage Graph Mock */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Pemantauan Sumber Daya
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* CPU metric */}
                    <div className="bg-white/60 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">BEBAN CPU</span>
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="text-xl font-black text-slate-800">18.4%</div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '18.4%' }}></div>
                      </div>
                    </div>
                    {/* RAM metric */}
                    <div className="bg-white/60 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">MEMORI</span>
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="text-xl font-black text-slate-800">1.2 GB / 4 GB</div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated charts line */}
                <div className="mt-4 pt-4 border-t border-slate-100/60 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Ping latensi: 12ms</span>
                  <span>Waktu Aktif: 14 hari, 3 jam</span>
                </div>
              </div>
            </div>

            {/* Interactive Terminal Mock */}
            <div className="mt-6 bg-slate-900 rounded-2xl p-4 font-mono text-xs text-blue-400 border border-slate-800 shadow-inner overflow-x-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-500 min-w-[500px]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Terminal noVNC - root@lab-jaringan-01</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[10px]">TERHUBUNG</span>
                </div>
              </div>
              <div className="space-y-1.5 min-w-[500px]">
                <p className="text-slate-500">Welcome to Ubuntu 22.04 LTS (GNU/Linux 5.15.0-88-generic x86_64)</p>
                <p className="text-slate-400">System load:  0.08               Memory usage: 30%</p>
                <p className="text-slate-400">Usage of /:   12.1% of 19.56GB   IP address:   192.168.1.100</p>
                <p className="text-blue-500">root@lab-jaringan-01:~# <span className="text-white hover:underline cursor-pointer">systemctl status nginx.service</span></p>
                <p className="text-green-400">● nginx.service - A high performance web server and a reverse proxy server</p>
                <p className="text-green-400">     Active: active (running) since Sun 2026-05-24 10:14:00 UTC; 8h ago</p>
                <p className="text-blue-500">root@lab-jaringan-01:~# <span className="animate-pulse text-white">|</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fasilitas" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold tracking-wider text-blue-600 uppercase">Fasilitas Infrastruktur</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Platform Pembelajaran & Riset
            </p>
            <p className="mt-4 text-base text-slate-500 font-medium">
              Memberikan pengalaman langsung (hands-on) bagi mahasiswa dalam mengelola peladen, jaringan, dan aplikasi dalam lingkungan yang terisolasi dan aman.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Praktikum KVM & LXC</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Mahasiswa dapat memilih antara isolasi penuh KVM (Virtual Machine) atau container LXC yang ringan untuk berbagai skenario praktikum sistem operasi dan jaringan.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Manajemen Snapshot</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Fitur snapshot memungkinkan mahasiswa untuk bereksperimen dengan konfigurasi sistem tanpa takut merusak lingkungan, karena status sistem dapat dikembalikan secara instan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Akses Konsol Web Terintegrasi</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Mengakses terminal server langsung dari peramban web (browser) tanpa memerlukan konfigurasi SSH eksternal, memudahkan proses pembelajaran di lab maupun dari rumah.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Penyediaan Cepat (Sub-minute)</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Sistem perutean dan templat cerdas kami secara otomatis membangun sistem operasi dan jaringan dalam waktu kurang dari satu menit, sehingga praktikum bisa segera dimulai.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Lingkungan Terisolasi & Aman</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Setiap mesin virtual mahasiswa beroperasi pada ruang yang terisolasi dengan aturan firewall khusus, mencegah intervensi antar proyek dan menjaga integritas data akademik.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Akses Akademik Terpusat</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                Infrastruktur jaringan berkinerja tinggi memastikan stabilitas koneksi bagi dosen dan mahasiswa untuk mengakses proyek, API, atau basis data riset secara global.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-slate-50 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                <img src={logoUrl} alt="Cloud Baja Tegal Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-800 text-lg leading-tight">Cloud Baja Tegal</span>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Politeknik Baja Tegal</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mt-2 hidden md:block">
              Infrastruktur komputasi cerdas dan inovatif yang dirancang khusus untuk praktikum dan riset civitas akademika.
            </p>
          </div>
          
          <div className="flex flex-col items-center lg:items-end gap-3 mt-4 lg:mt-0">
            <a href="https://pbjt.ac.id" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
              Website Resmi PBJT
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <p className="text-xs text-slate-400 font-medium text-center mt-2">
              © {new Date().getFullYear()} Politeknik Baja Tegal.<br className="md:hidden" /> Hak Cipta Dilindungi Undang-Undang.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
