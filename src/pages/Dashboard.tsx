import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

type Subject = { id: number; name: string; createdAt: string };
type Category = { id: number; name: string; subjectId: number; createdAt: string };
type Record = {
  id: number;
  date: string;
  subjectId: number;
  categoryId: number;
  isAssignedGrading: boolean;
  score: number | null;
  rawScore: number | null;
  assignedScore: number | null;
  classRank: number | null;
  gradeRank: number | null;
  reflection: string | null;
  peerScores: string | null;
};

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySubjectId, setNewCategorySubjectId] = useState('');

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    subjectId: '',
    categoryId: '',
    isAssignedGrading: false,
    score: '',
    rawScore: '',
    assignedScore: '',
    classRank: '',
    gradeRank: '',
    reflection: '',
    peerScores: [] as { name: string; score: string; rank: string }[],
  });

  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, catsRes, recsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/categories'),
        fetch('/api/records'),
      ]);
      setSubjects(await subsRes.json());
      setCategories(await catsRes.json());
      setRecords(await recsRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubjectName }),
    });
    setNewSubjectName('');
    fetchData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || !newCategorySubjectId) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, subjectId: newCategorySubjectId }),
    });
    setNewCategoryName('');
    fetchData();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setShowAddRecord(false);
    fetchData();
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // Chart Data Preparation
  const chartData = records.map(r => {
    const subject = subjects.find(s => s.id === r.subjectId)?.name || 'Unknown';
    const category = categories.find(c => c.id === r.categoryId)?.name || 'Unknown';
    return {
      ...r,
      dateFormatted: format(new Date(r.date), 'MMM dd, yyyy'),
      subjectName: subject,
      categoryName: category,
      displayScore: r.isAssignedGrading ? r.assignedScore : r.score,
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by subject for the chart
  const groupedBySubject = subjects.map(sub => {
    return {
      subject: sub.name,
      data: chartData.filter(d => d.subjectId === sub.id)
    };
  }).filter(g => g.data.length > 0);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => setShowAddRecord(!showAddRecord)}>
          {showAddRecord ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add Record</>}
        </Button>
      </div>

      {showAddRecord && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur">
          <CardHeader>
            <CardTitle>New Score Record</CardTitle>
            <CardDescription>Add a new exam score to track your progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    value={formData.subjectId}
                    onChange={e => setFormData({...formData, subjectId: e.target.value, categoryId: ''})}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    required
                    disabled={!formData.subjectId}
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c.subjectId.toString() === formData.subjectId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-300"
                      checked={formData.isAssignedGrading}
                      onChange={e => setFormData({...formData, isAssignedGrading: e.target.checked})}
                    />
                    Assigned Grading (赋分制)
                  </Label>
                </div>

                {!formData.isAssignedGrading ? (
                  <div className="space-y-2">
                    <Label>Score</Label>
                    <Input 
                      type="number" step="0.1" 
                      value={formData.score}
                      onChange={e => setFormData({...formData, score: e.target.value})}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Raw Score (卷面分)</Label>
                      <Input 
                        type="number" step="0.1" 
                        value={formData.rawScore}
                        onChange={e => setFormData({...formData, rawScore: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned Score (赋分)</Label>
                      <Input 
                        type="number" step="0.1" 
                        value={formData.assignedScore}
                        onChange={e => setFormData({...formData, assignedScore: e.target.value})}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full flex justify-between items-center"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                >
                  <span>Optional Fields (Ranks, Reflection)</span>
                  {showOptionalFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showOptionalFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label>Class Rank</Label>
                      <Input 
                        type="number" 
                        value={formData.classRank}
                        onChange={e => setFormData({...formData, classRank: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade Rank</Label>
                      <Input 
                        type="number" 
                        value={formData.gradeRank}
                        onChange={e => setFormData({...formData, gradeRank: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Reflection</Label>
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                        value={formData.reflection}
                        onChange={e => setFormData({...formData, reflection: e.target.value})}
                        placeholder="What went well? What needs improvement?"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Peer Scores</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFormData({...formData, peerScores: [...formData.peerScores, { name: '', score: '', rank: '' }]})}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Peer
                        </Button>
                      </div>
                      {formData.peerScores.map((peer, idx) => (
                        <div key={idx} className="flex gap-2 items-center mt-2">
                          <Input 
                            placeholder="Name" 
                            value={peer.name} 
                            onChange={e => {
                              const newPeers = [...formData.peerScores];
                              newPeers[idx].name = e.target.value;
                              setFormData({...formData, peerScores: newPeers});
                            }} 
                          />
                          <Input 
                            placeholder="Score" 
                            type="number" step="0.1"
                            value={peer.score} 
                            onChange={e => {
                              const newPeers = [...formData.peerScores];
                              newPeers[idx].score = e.target.value;
                              setFormData({...formData, peerScores: newPeers});
                            }} 
                          />
                          <Input 
                            placeholder="Rank" 
                            type="number"
                            value={peer.rank} 
                            onChange={e => {
                              const newPeers = [...formData.peerScores];
                              newPeers[idx].rank = e.target.value;
                              setFormData({...formData, peerScores: newPeers});
                            }} 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={() => {
                              const newPeers = formData.peerScores.filter((_, i) => i !== idx);
                              setFormData({...formData, peerScores: newPeers});
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Save Record</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Score Trends</CardTitle>
              <CardDescription>Your performance over time across all subjects.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                      <XAxis 
                        dataKey="dateFormatted" 
                        type="category" 
                        allowDuplicatedCategory={false}
                        className="text-xs text-zinc-500"
                      />
                      <YAxis className="text-xs text-zinc-500" domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#18181b' }}
                      />
                      <Legend />
                      {groupedBySubject.map((group, i) => (
                        <Line 
                          key={group.subject}
                          data={group.data}
                          type="monotone" 
                          dataKey="displayScore" 
                          name={group.subject} 
                          stroke={colors[i % colors.length]} 
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    No data available. Add some records to see the chart.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.slice().reverse().map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {record.subjectName} 
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {record.categoryName}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">{record.dateFormatted}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {record.displayScore}
                        </div>
                        {record.isAssignedGrading && (
                          <div className="text-xs text-zinc-500">Raw: {record.rawScore}</div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteRecord(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {chartData.length === 0 && (
                  <div className="text-center text-zinc-500 py-4">No records found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubject} className="flex gap-2">
                <Input 
                  value={newSubjectName} 
                  onChange={e => setNewSubjectName(e.target.value)} 
                  placeholder="Subject Name" 
                  required 
                />
                <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
              </form>
              <div className="mt-4 space-y-2">
                {subjects.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="space-y-2">
                <select 
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                  value={newCategorySubjectId}
                  onChange={e => setNewCategorySubjectId(e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="Category Name (e.g. Midterm)" 
                    required 
                  />
                  <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
                </div>
              </form>
              <div className="mt-4 space-y-2">
                {categories.map(c => {
                  const subject = subjects.find(s => s.id === c.subjectId);
                  return (
                    <div key={c.id} className="flex justify-between items-center text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                      <span>{c.name} <span className="text-zinc-500 text-xs">({subject?.name})</span></span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
