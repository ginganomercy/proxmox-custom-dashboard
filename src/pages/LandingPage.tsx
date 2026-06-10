import { useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800 relative overflow-hidden font-sans">
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
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Cloud Baja Tegal (CBT)
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#preview" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Console Preview</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
          </nav>

          {/* Call to Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/login" 
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-blue-500" />
            Deploy High Performance Cloud Instances in Under 60 Seconds
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Next-Gen Cloud VPS & Containers{" "}
            <span className="block mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Powered by Cloud Baja Tegal (CBT)
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Run isolated virtual machines and lightweight containers on enterprise-grade hardware. Manage snapshots, network configurations, and direct console access with total freedom.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={isLoggedIn ? "/dashboard" : "/login"} 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all text-base transform hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Go to Dashboard" : "Deploy VPS Now"}
            </Link>
            <a 
              href="#preview" 
              className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 hover:border-blue-300 font-semibold rounded-2xl transition-all text-base flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              See Console Interface
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              KVM Virtualization
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              LXC Container Support
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Instant Snapshots
            </div>
          </div>
        </section>

        {/* Visual Preview / Replica Card Section */}
        <section id="preview" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 rounded-3xl p-4 sm:p-6 shadow-xl shadow-blue-900/5 border border-white/80 backdrop-blur-md relative">
            {/* Top bar replica */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-xs font-semibold text-slate-400 ml-2">Console Interface Preview</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100/50 rounded-full px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                <span className="text-xs font-medium text-blue-700">Cluster Status: Healthy</span>
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
                      <h3 className="text-lg font-bold text-slate-800">web-vps-production</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      Running
                    </span>
                  </div>
                  <div className="space-y-3.5 my-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">OS Template</span>
                      <span className="font-semibold text-slate-700">Ubuntu 22.04 LTS</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Core Allocation</span>
                      <span className="font-semibold text-slate-700">2 vCPUs (Dedicated)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Storage Type</span>
                      <span className="font-semibold text-slate-700">Enterprise NVMe SSD</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className="text-xs font-semibold text-slate-500">Node: Capybara</span>
                </div>
              </div>

              {/* VM Usage Graph Mock */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Resource Monitoring
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* CPU metric */}
                    <div className="bg-white/60 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">CPU LOAD</span>
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
                        <span className="text-xs font-bold text-slate-400">MEMORY</span>
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
                  <span>Ping latency: 12ms</span>
                  <span>Uptime: 14 days, 3 hours</span>
                </div>
              </div>
            </div>

            {/* Interactive Terminal Mock */}
            <div className="mt-6 bg-slate-900 rounded-2xl p-4 font-mono text-xs text-blue-400 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>noVNC Terminal - root@web-vps-production</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[10px]">CONNECTED</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-500">Welcome to Ubuntu 22.04 LTS (GNU/Linux 5.15.0-88-generic x86_64)</p>
                <p className="text-slate-500">* Documentation:  https://help.ubuntu.com</p>
                <p className="text-slate-500">* Management:     https://landscape.canonical.com</p>
                <p className="text-slate-400">System load:  0.08               Memory usage: 30%</p>
                <p className="text-slate-400">Usage of /:   12.1% of 19.56GB   IP address:   192.168.1.100</p>
                <p className="text-blue-500">root@web-vps-production:~# <span className="text-white hover:underline cursor-pointer">systemctl status nginx.service</span></p>
                <p className="text-green-400">● nginx.service - A high performance web server and a reverse proxy server</p>
                <p className="text-green-400">     Active: active (running) since Sun 2026-05-24 10:14:00 UTC; 8h ago</p>
                <p className="text-blue-500">root@web-vps-production:~# <span className="animate-pulse text-white">|</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold tracking-wider text-blue-600 uppercase">Enterprise Stack</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Power Packed Infrastructure
            </p>
            <p className="mt-4 text-base text-slate-500 font-medium">
              Everything you need to run, configure, and scale web applications, databases, and microservices in isolated environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dedicated KVM & LXC</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                Choose between strict KVM hypervisor isolation for full operating system customizability, or fast LXC containers for minimal overhead.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant Snapshots</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                Take state snapshots before risky system updates or package installations. Revert changes instantly if something breaks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Native Terminal</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                Connect securely to your machine console directly inside your web browser. No SSH configuration or external key file required.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sub-minute Deploy</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                Our template engine handles operating system cloning and network interface provisioning automatically in under one minute.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top-tier Security</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                Each VPS has dedicated firewall settings and isolated VLAN routing. Your cloud environment is shielded from surrounding virtual machines.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Global Network</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                High throughput uplinks ensure minimal packet drops and exceptional loading times for global API clients and web traffic.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold tracking-wider text-blue-600 uppercase">Pricing Tiers</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple, Predictable Pricing
            </p>
            <p className="mt-4 text-base text-slate-500 font-medium">
              No hidden costs or unexpected data billing. Choose the resources that fit your application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Developer Starter</h3>
                <p className="mt-2 text-xs text-slate-400 font-semibold uppercase">LXC Container</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$5</span>
                  <span className="text-sm font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">
                  Ideal for testing applications, small APIs, script scheduling, or personal staging.
                </p>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    1 vCPU Core
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    2 GB DDR4 RAM
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    20 GB NVMe Storage
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    1 TB Monthly Traffic
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link 
                  to="/login" 
                  className="block w-full py-3 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-center font-semibold rounded-xl text-sm border border-slate-200 hover:border-blue-300 transition-all"
                >
                  Deploy Container
                </Link>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-white p-8 rounded-2xl border-2 border-blue-500 shadow-lg shadow-blue-500/5 flex flex-col justify-between relative">
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wide">
                POPULAR
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Developer Plus</h3>
                <p className="mt-2 text-xs text-blue-600 font-bold uppercase">Dedicated KVM VPS</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$15</span>
                  <span className="text-sm font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">
                  Perfect for busy database hosts, production backends, and full Linux workspace environments.
                </p>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    2 vCPU Cores
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    4 GB DDR4 RAM
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    50 GB NVMe Storage
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    3 TB Monthly Traffic
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link 
                  to="/login" 
                  className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all"
                >
                  Deploy VPS
                </Link>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Production Node</h3>
                <p className="mt-2 text-xs text-slate-400 font-semibold uppercase">Dedicated KVM VPS</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$35</span>
                  <span className="text-sm font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">
                  Designed for heavy enterprise production environments, Kubernetes nodes, and high traffic web sites.
                </p>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    4 vCPU Cores
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    8 GB DDR4 RAM
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    100 GB NVMe Storage
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    5 TB Monthly Traffic
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link 
                  to="/login" 
                  className="block w-full py-3 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-center font-semibold rounded-xl text-sm border border-slate-200 hover:border-blue-300 transition-all"
                >
                  Deploy Production VPS
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/40 py-8 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded-md">
              <Server className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">Cloud Baja Tegal (CBT)</span>
          </div>
          <p>© {new Date().getFullYear()} Cloud Baja Tegal (CBT) Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
