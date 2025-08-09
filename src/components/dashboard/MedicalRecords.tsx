'use client';

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  Tag,
  Upload,
  Camera,
  Plus,
  FileImage,
  FileCheck,
  Stethoscope,
  Pill,
  Heart,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  ExternalLink,
  Brain,
  Loader2
} from 'lucide-react';
import { type User, getMedicalRecords, type MedicalRecord, deleteMedicalRecord, downloadMedicalFile, updateMedicalRecord, analyzeExistingRecord } from '@/lib/supabase';
import { analyzeMedicalDocument } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface MedicalRecordsProps {
  user: User;
  onUpload?: (type: 'camera' | 'file') => void;
}

const categoryIcons = {
  prescription: Pill,
  'lab-report': FileCheck,
  'medical-bill': FileText,
  'scan-report': FileImage,
  'consultation': Stethoscope,
  'vaccination': Heart,
  'vital-signs': Activity,
  other: FileText
};

const categoryColors = {
  prescription: 'bg-blue-100 text-blue-800 border-blue-200',
  'lab-report': 'bg-green-100 text-green-800 border-green-200',
  'medical-bill': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'scan-report': 'bg-purple-100 text-purple-800 border-purple-200',
  'consultation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'vaccination': 'bg-red-100 text-red-800 border-red-200',
  'vital-signs': 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function MedicalRecords({ user, onUpload }: MedicalRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState<string | null>(null);

  const loadRecords = async () => {
    setIsRefreshing(true);
    try {
      console.log('MedicalRecords: Loading records for user ID:', user.id);
      console.log('MedicalRecords: User email:', user.email);
      
      const { data } = await getMedicalRecords(user.id);
      console.log('MedicalRecords: Query result:', data);
      
      if (data) {
        console.log('MedicalRecords: Found', data.length, 'records');
        setRecords(data);
        setFilteredRecords(data);
      } else {
        console.log('MedicalRecords: No records found for user');
        setRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handleDownloadRecord = async (record: MedicalRecord) => {
    try {
      if (record.file_path) {
        // Download actual file from storage
        const { data, error } = await downloadMedicalFile(record.file_path);
        
        if (error) {
          console.error('Error downloading file:', error);
          return;
        }
        
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = record.file_name || `${record.title}.${record.file_type?.split('/')[1] || 'file'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // Fallback: Create a text file with record information
        const recordData = {
          title: record.title,
          category: record.category,
          description: record.description,
          summary: record.summary,
          date: record.created_at,
          fileName: record.file_name
        };

        const blob = new Blob([JSON.stringify(recordData, null, 2)], {
          type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading record:', error);
    }
  };

  const handleDeleteRecord = async (record: MedicalRecord) => {
    if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      try {
        const { error } = await deleteMedicalRecord(record.id);
        if (error) {
          console.error('Error deleting record:', error);
          alert('Failed to delete record. Please try again.');
        } else {
          await loadRecords(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record. Please try again.');
      }
    }
  };

  const handleAnalyzeRecord = async (record: MedicalRecord) => {
    if (!record.file_path) {
      alert('Cannot analyze record: No file attached.');
      return;
    }

    setAiAnalysisLoading(record.id);
    
    try {
      // Download the file first
      const { data: fileBlob, error: downloadError } = await downloadMedicalFile(record.file_path);
      
      if (downloadError || !fileBlob) {
        throw new Error('Failed to download file for analysis');
      }

      // Convert blob to file
      const file = new File([fileBlob], record.file_name || 'document', {
        type: record.file_type || 'application/octet-stream'
      });

      // Analyze with AI
      const analysis = await analyzeMedicalDocument(file);
      
      // Save analysis to database
      const { error: updateError } = await analyzeExistingRecord(record.id, analysis);
      
      if (updateError) {
        throw new Error('Failed to save analysis to database');
      }

      // Refresh records to show updated analysis
      await loadRecords();
      
      // Show the analysis
      setShowAiSummary(record.id);
      
    } catch (error) {
      console.error('Error analyzing record:', error);
      alert(`Failed to analyze record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiAnalysisLoading(null);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user.id]);

  useEffect(() => {
    let filtered = records;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.category === selectedCategory);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, selectedCategory]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const categories = [
    { value: 'all', label: 'All Records', count: records.length },
    { value: 'prescription', label: 'Prescriptions', count: records.filter(r => r.category === 'prescription').length },
    { value: 'lab-report', label: 'Lab Reports', count: records.filter(r => r.category === 'lab-report').length },
    { value: 'medical-bill', label: 'Medical Bills', count: records.filter(r => r.category === 'medical-bill').length },
    { value: 'scan-report', label: 'Scans', count: records.filter(r => r.category === 'scan-report').length },
    { value: 'consultation', label: 'Consultations', count: records.filter(r => r.category === 'consultation').length },
    { value: 'vaccination', label: 'Vaccinations', count: records.filter(r => r.category === 'vaccination').length },
    { value: 'vital-signs', label: 'Vital Signs', count: records.filter(r => r.category === 'vital-signs').length },
    { value: 'other', label: 'Other', count: records.filter(r => r.category === 'other').length },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const RecordCard = ({ record }: { record: MedicalRecord }) => {
    const IconComponent = categoryIcons[record.category as keyof typeof categoryIcons] || FileText;
    const colorClass = categoryColors[record.category as keyof typeof categoryColors] || categoryColors.other;

    return (
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', colorClass)}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-medium truncate">
                  {record.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {new Date(record.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs capitalize">
                {record.category.replace('-', ' ')}
              </Badge>
              <div className="relative dropdown-container">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpenDropdown(openDropdown === record.id ? null : record.id)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {openDropdown === record.id && (
                  <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px]">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleViewRecord(record);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadRecord(record);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      {record.file_path && (
                        <button
                          onClick={() => {
                            handleAnalyzeRecord(record);
                            setOpenDropdown(null);
                          }}
                          disabled={aiAnalysisLoading === record.id}
                          className="flex items-center w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                        >
                          {aiAnalysisLoading === record.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4 mr-2" />
                          )}
                          AI Analysis
                        </button>
                      )}
                      {record.file_url && (
                        <button
                          onClick={() => {
                            window.open(record.file_url, '_blank');
                            setOpenDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open File
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingRecord(record);
                          setShowEditModal(true);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteRecord(record);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {record.summary && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {record.summary}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{record.file_name}</span>
            <span>{formatFileSize(record.file_size || 0)}</span>
          </div>

          {/* AI Analysis Summary Button */}
          {record.ai_analysis && (
            <div className="mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAiSummary(showAiSummary === record.id ? null : record.id)}
                className="w-full text-xs"
              >
                <Brain className="h-3 w-3 mr-1" />
                {showAiSummary === record.id ? 'Hide' : 'Show'} AI Analysis
              </Button>
              
              {showAiSummary === record.id && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  {(() => {
                    try {
                      const analysis = JSON.parse(record.ai_analysis);
                      return (
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-purple-900 text-xs mb-1">Summary:</h5>
                            <p className="text-xs text-purple-700">{analysis.summary}</p>
                          </div>
                          {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                            <div>
                              <h5 className="font-medium text-purple-900 text-xs mb-1">Key Findings:</h5>
                              <ul className="text-xs text-purple-700 list-disc list-inside">
                                {analysis.keyFindings.map((finding: string, idx: number) => (
                                  <li key={idx}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.medications && analysis.medications.length > 0 && (
                            <div>
                              <h5 className="font-medium text-purple-900 text-xs mb-1">Medications:</h5>
                              <ul className="text-xs text-purple-700 list-disc list-inside">
                                {analysis.medications.map((med: string, idx: number) => (
                                  <li key={idx}>{med}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.urgencyLevel && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-purple-900">Urgency:</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                analysis.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                                analysis.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {analysis.urgencyLevel.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-xs text-purple-700">Invalid analysis data</p>;
                    }
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => handleViewRecord(record)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => handleDownloadRecord(record)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const RecordListItem = ({ record }: { record: MedicalRecord }) => {
    const IconComponent = categoryIcons[record.category as keyof typeof categoryIcons] || FileText;
    const colorClass = categoryColors[record.category as keyof typeof categoryColors] || categoryColors.other;

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className={cn('p-2 rounded-lg', colorClass)}>
                <IconComponent className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{record.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(record.created_at).toLocaleDateString()} • {record.file_name}
                </p>
                {record.summary && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{record.summary}</p>
                )}
              </div>

              <div className="hidden md:flex items-center space-x-3">
                <Badge variant="secondary" className="text-xs capitalize">
                  {record.category.replace('-', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatFileSize(record.file_size || 0)}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 ml-4">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleViewRecord(record)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDownloadRecord(record)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Manage and view your medical documents</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadRecords()}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpload?.('camera')}>
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button size="sm" onClick={() => onUpload?.('file')}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Record
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={activeView === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('grid')}
          >
            Grid
          </Button>
          <Button
            variant={activeView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 h-auto p-1">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.value} 
              value={category.value}
              className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <span className="hidden md:inline">{category.label}</span>
              <span className="md:hidden">{category.label.split(' ')[0]}</span>
              {category.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Records Display */}
        <TabsContent value={selectedCategory} className="mt-6">
          {filteredRecords.length > 0 ? (
            <div className={cn(
              activeView === 'grid' 
                ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' 
                : 'space-y-4'
            )}>
              {filteredRecords.map((record) => 
                activeView === 'grid' ? (
                  <RecordCard key={record.id} record={record} />
                ) : (
                  <RecordListItem key={record.id} record={record} />
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No records found' 
                  : 'No medical records yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload your first medical record to get started'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <div className="flex justify-center space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => onUpload?.('camera')}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button onClick={() => onUpload?.('file')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Record View Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRecord?.title}</DialogTitle>
            <DialogDescription>
              {selectedRecord?.category.replace('-', ' ')} • {selectedRecord && new Date(selectedRecord.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedRecord.description || 'No description available'}
                </p>
              </div>
              
              {selectedRecord.summary && (
                <div>
                  <h4 className="font-medium mb-2">AI Summary</h4>
                  <p className="text-sm text-gray-600">{selectedRecord.summary}</p>
                </div>
              )}

              {/* Full AI Analysis Display */}
              {selectedRecord.ai_analysis && (
                <div>
                  <h4 className="font-medium mb-2">Detailed AI Analysis</h4>
                  {(() => {
                    try {
                      const analysis = JSON.parse(selectedRecord.ai_analysis);
                      return (
                        <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                            <div>
                              <h5 className="font-medium text-purple-900 text-sm mb-1">Key Findings:</h5>
                              <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                                {analysis.keyFindings.map((finding: string, idx: number) => (
                                  <li key={idx}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.medications && analysis.medications.length > 0 && (
                            <div>
                              <h5 className="font-medium text-purple-900 text-sm mb-1">Medications:</h5>
                              <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                                {analysis.medications.map((med: string, idx: number) => (
                                  <li key={idx}>{med}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div>
                              <h5 className="font-medium text-purple-900 text-sm mb-1">Recommendations:</h5>
                              <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                                {analysis.recommendations.map((rec: string, idx: number) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.urgencyLevel && (
                            <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                              <span className="text-sm font-medium text-purple-900">Urgency Level:</span>
                              <span className={`text-sm px-3 py-1 rounded-full ${
                                analysis.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                                analysis.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {analysis.urgencyLevel.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-sm text-gray-500">Invalid analysis data</p>;
                    }
                  })()}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File:</span>
                  <p className="text-gray-600">{selectedRecord.file_name}</p>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <p className="text-gray-600">{formatFileSize(selectedRecord.file_size || 0)}</p>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <p className="text-gray-600">{selectedRecord.file_type}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <p className="text-gray-600 capitalize">{selectedRecord.category.replace('-', ' ')}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadRecord(selectedRecord)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setShowRecordModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      {editingRecord && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Medical Record</DialogTitle>
              <DialogDescription>
                Update the details of this medical record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingRecord.title}
                  onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={editingRecord.category}
                  onChange={(e) => setEditingRecord({...editingRecord, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="prescription">Prescription</option>
                  <option value="lab-report">Lab Report</option>
                  <option value="medical-bill">Medical Bill</option>
                  <option value="scan-report">Scan/X-Ray</option>
                  <option value="consultation">Consultation Report</option>
                  <option value="vaccination">Vaccination Record</option>
                  <option value="vital-signs">Vital Signs</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingRecord.description || ''}
                  onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const { error } = await updateMedicalRecord(editingRecord.id, {
                        title: editingRecord.title,
                        category: editingRecord.category,
                        description: editingRecord.description
                      });
                      
                      if (error) {
                        console.error('Error updating record:', error);
                        alert('Failed to update record. Please try again.');
                      } else {
                        setShowEditModal(false);
                        setEditingRecord(null);
                        await loadRecords(); // Refresh the list
                      }
                    } catch (error) {
                      console.error('Error updating record:', error);
                      alert('Failed to update record. Please try again.');
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
