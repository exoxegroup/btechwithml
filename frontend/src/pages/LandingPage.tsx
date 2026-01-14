
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BrainCircuit, BarChart2, Clock, Sparkles } from 'lucide-react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100">
    <div className="flex items-center justify-center w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl mb-6 mx-auto">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-800 text-center">{title}</h3>
    <p className="text-slate-600 text-center leading-relaxed">{description}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <header className="w-full py-6 px-4 bg-white/80 backdrop-blur-md fixed top-0 z-50 border-b border-slate-200">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">TEB ML</h1>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2.5 text-slate-600 font-semibold hover:text-teal-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-md hover:shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-200 rounded-full blur-3xl mix-blend-multiply filter animate-blob"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-200 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 flex flex-col justify-center items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold mb-8 border border-teal-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            New: ML-Powered Smart Grouping & Analytics
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight max-w-4xl">
            Master Building Technology with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Machine Learning Intelligent Collaboration</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Building Technology uses Machine Learning to form balanced study groups, track long-term retention, and provide deep insights into student performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link to="/register" className="px-8 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">
              Start Learning Now <Sparkles size={20} />
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-md hover:shadow-lg">
              Teacher Login
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="w-full bg-white py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powered by Next-Gen ML</h3>
            <p className="text-slate-600 text-lg">Everything you need to enhance student engagement and track academic growth.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<BrainCircuit size={28} />}
              title="Smart ML Grouping"
              description="Automatically create balanced groups based on pre-test scores, gender, and learning styles using Gemini ML algorithms."
            />
            <FeatureCard
              icon={<Clock size={28} />}
              title="Retention Tracking"
              description="Monitor knowledge retention over time with automated post-tests and retention intervals to measure long-term learning."
            />
            <FeatureCard
              icon={<BarChart2 size={28} />}
              title="Deep Analytics"
              description="Visualize improvement rates, gender performance gaps, and collaboration metrics with our new research-grade dashboard."
            />
             <FeatureCard
              icon={<Users size={28} />}
              title="Collaborative Spaces"
              description="Real-time video, audio, and text chat in both main classroom and group sessions for effective peer-to-peer learning."
            />
            <FeatureCard
              icon={<BookOpen size={28} />}
              title="Curriculum Aligned"
              description="Tailored building technology content designed to meet educational standards and foster critical thinking skills."
            />
            <FeatureCard
              icon={<Sparkles size={28} />}
              title="Engagement Scoring"
              description="Track student participation and engagement levels automatically to identify at-risk students early."
            />
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-12">Trusted for Educational Research</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="p-4">
                    <div className="text-4xl font-bold text-teal-400 mb-2">95%</div>
                    <div className="text-slate-400">Student Engagement</div>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-blue-400 mb-2">30%</div>
                    <div className="text-slate-400">Retention Improvement</div>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-purple-400 mb-2">ML</div>
                    <div className="text-slate-400">Powered Insights</div>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-pink-400 mb-2">24/7</div>
                    <div className="text-slate-400">Availability</div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-teal-900 rounded flex items-center justify-center">
              <Sparkles className="text-teal-500 w-3 h-3" />
            </div>
            <span className="font-bold text-slate-200 text-lg">TEB ML</span>
          </div>
          <p className="text-sm">&copy; 2025 TEB ML. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
