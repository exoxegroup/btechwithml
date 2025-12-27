import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClassDetails, updateClass } from '../services/api';
import { ClassDetails } from '../../types';
import Header from '../components/common/Header';
import { Spinner } from '../components/common/Spinner';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RetentionSettingsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);

  // Retention Test State
  const [retWeeks, setRetWeeks] = useState(0);
  const [retDays, setRetDays] = useState(0);
  const [retHours, setRetHours] = useState(0);
  const [retMinutes, setRetMinutes] = useState(0);

  // Post Test State
  const [postWeeks, setPostWeeks] = useState(0);
  const [postDays, setPostDays] = useState(0);
  const [postHours, setPostHours] = useState(0);
  const [postMinutes, setPostMinutes] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!classId) return;
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      try {
        setLoading(true);
        const details = await getClassDetails(classId, token);
        setClassDetails(details);
        
        if (details.retentionTestDelayMinutes) {
          const totalMinutes = details.retentionTestDelayMinutes;
          const w = Math.floor(totalMinutes / (7 * 24 * 60));
          const remainingAfterWeeks = totalMinutes % (7 * 24 * 60);
          
          const d = Math.floor(remainingAfterWeeks / (24 * 60));
          const remainingAfterDays = remainingAfterWeeks % (24 * 60);
          
          const h = Math.floor(remainingAfterDays / 60);
          const m = remainingAfterDays % 60;

          setRetWeeks(w);
          setRetDays(d);
          setRetHours(h);
          setRetMinutes(m);
        }

        if (details.postTestDelayMinutes) {
            const totalMinutes = details.postTestDelayMinutes;
            const w = Math.floor(totalMinutes / (7 * 24 * 60));
            const remainingAfterWeeks = totalMinutes % (7 * 24 * 60);
            
            const d = Math.floor(remainingAfterWeeks / (24 * 60));
            const remainingAfterDays = remainingAfterWeeks % (24 * 60);
            
            const h = Math.floor(remainingAfterDays / 60);
            const m = remainingAfterDays % 60;
  
            setPostWeeks(w);
            setPostDays(d);
            setPostHours(h);
            setPostMinutes(m);
          }
      } catch (err) {
        console.error('Failed to load class details:', err);
        toast.error('Failed to load class details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [classId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setSaving(true);
      const retentionTotalMinutes = 
        (retWeeks * 7 * 24 * 60) + 
        (retDays * 24 * 60) + 
        (retHours * 60) + 
        retMinutes;

      const postTestTotalMinutes = 
        (postWeeks * 7 * 24 * 60) + 
        (postDays * 24 * 60) + 
        (postHours * 60) + 
        postMinutes;

      await updateClass(classId, undefined, retentionTotalMinutes, postTestTotalMinutes, token);
      toast.success('Test availability settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (!classDetails) return <div className="text-center p-8">Class not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/teacher-dashboard" className="inline-flex items-center text-slate-500 hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-6">
            <div className="bg-teal-100 p-3 rounded-full text-teal-600">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Test Availability Settings</h1>
              <p className="text-slate-500">Configure when the Post-test and Retention test become available after class ends</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Post-Test Settings */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Post-Test Availability</h2>
              <p className="text-sm text-slate-500 mb-4">Set how long students must wait after the class session ends before taking the Post-test.</p>
              
              <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Delay Duration
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Weeks</label>
                  <input
                    type="number"
                    min="0"
                    value={postWeeks}
                    onChange={(e) => setPostWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Days</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={postDays}
                    onChange={(e) => setPostDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={postHours}
                    onChange={(e) => setPostHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={postMinutes}
                    onChange={(e) => setPostMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
                <Clock size={14} />
                Total delay: {postWeeks} weeks, {postDays} days, {postHours} hours, {postMinutes} minutes
              </p>
            </div>

            {/* Retention Test Settings */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Retention Test Availability</h2>
              <p className="text-sm text-slate-500 mb-4">Set how long students must wait after the Post-test is submitted before taking the Retention test.</p>

              <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Delay Duration
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Weeks</label>
                  <input
                    type="number"
                    min="0"
                    value={retWeeks}
                    onChange={(e) => setRetWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Days</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={retDays}
                    onChange={(e) => setRetDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={retHours}
                    onChange={(e) => setRetHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={retMinutes}
                    onChange={(e) => setRetMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
                <Clock size={14} />
                Total delay: {retWeeks} weeks, {retDays} days, {retHours} hours, {retMinutes} minutes
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-70 shadow-md"
              >
                {saving ? <Spinner size="sm" color="text-white" /> : <Save size={20} />}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RetentionSettingsPage;
