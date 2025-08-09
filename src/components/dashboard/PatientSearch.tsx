'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  User,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Eye,
  Download,
  Clock,
  Activity,
  Stethoscope,
  Users,
  QrCode,
  BarChart3,
  TrendingUp,
  Shield
} from 'lucide-react';
import { 
  type User as UserType, 
  searchPatientsAdvanced, 
  getPatientRecords, 
  getPatientDetails,
  type User as PatientType, 
  type MedicalRecord 
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PatientSearchProps {
  user: UserType;
}

interface PatientDetails {
  patient: PatientType;
  recentRecords: MedicalRecord[];
  stats: {
    totalRecords: number;
    recordsByCategory: Record<string, number>;
    totalAppointments: number;
    appointmentsByStatus: Record<string, number>;
  };
}

export default function PatientSearch({ user }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientType[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientType | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchPatientsAdvanced(searchTerm);
      if (results.data && !results.error) {
        setSearchResults(results.data);
      } else {
        setSearchResults([]);
        if (results.error) {
          console.error('Search error:', results.error);
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = async (patient: PatientType) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);
    
    try {
      const details = await getPatientDetails(patient.id);
      if (details.data && !details.error) {
        setPatientDetails(details.data);
        setPatientRecords(details.data.recentRecords);
      } else {
        setPatientDetails(null);
        setPatientRecords([]);
        if (details.error) {
          console.error('Details error:', details.error);
        }
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      setPatientDetails(null);
      setPatientRecords([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const PatientCard = ({ patient }: { patient: PatientType }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 hover:-translate-y-1 group"
      onClick={() => handleSelectPatient(patient)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {patient.first_name} {patient.last_name}
              </CardTitle>
              <CardDescription className="font-mono text-sm">
                MED ID: {patient.med_id}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary">Patient</Badge>
            <div className="mt-1 text-xs text-gray-500">
              Click to view details
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Age: {formatAge(patient.date_of_birth || '')}
            </div>
            {patient.gender && (
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {patient.blood_group && (
              <div className="flex items-center text-red-600 font-medium">
                <Heart className="h-4 w-4 mr-2" />
                {patient.blood_group}
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {patient.phone.slice(-4).padStart(patient.phone.length, '*')}
              </div>
            )}
          </div>
        </div>
        
        {/* Health Alerts */}
        <div className="mt-3 flex flex-wrap gap-1">
          {patient.allergies && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Allergies
            </Badge>
          )}
          {patient.medical_conditions && (
            <Badge variant="outline" className="text-xs">
              <Stethoscope className="h-3 w-3 mr-1" />
              Conditions
            </Badge>
          )}
          {patient.medications && (
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Medications
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const PatientDetails = ({ patient, details }: { patient: PatientType; details: PatientDetails | null }) => (
    <div className="space-y-6">
      {/* Basic Patient Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {patient.first_name} {patient.last_name}
                </CardTitle>
                <CardDescription className="font-mono">
                  MED ID: {patient.med_id}
                </CardDescription>
                <div className="flex items-center mt-2 space-x-4">
                  <Badge variant="secondary">Patient</Badge>
                  <span className="text-xs text-gray-500">
                    Member since {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Verified Patient</span>
              </div>
              {details && (
                <div className="text-sm text-gray-600">
                  <div>{details.stats.totalRecords} Records</div>
                  <div>{details.stats.totalAppointments} Appointments</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Age:</span>
                  </div>
                  <span className="font-medium">{formatAge(patient.date_of_birth || '')}</span>
                </div>
                
                {patient.gender && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Gender:</span>
                    </div>
                    <span className="font-medium capitalize">{patient.gender}</span>
                  </div>
                )}
                
                {patient.phone && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Phone:</span>
                    </div>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                )}
                
                {patient.email && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                    </div>
                    <span className="font-medium">{patient.email}</span>
                  </div>
                )}
                
                {patient.address && (
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <span className="text-gray-600 text-sm">Address:</span>
                        <p className="font-medium text-sm mt-1">{patient.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Stethoscope className="h-4 w-4 mr-2" />
                Medical Information
              </h4>
              <div className="space-y-3">
                {patient.blood_group && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-red-700 font-medium">Blood Type:</span>
                    </div>
                    <span className="font-bold text-red-800">{patient.blood_group}</span>
                  </div>
                )}

                {patient.allergies && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">Allergies</span>
                    </div>
                    <p className="text-sm text-red-700">{patient.allergies}</p>
                  </div>
                )}

                {patient.medical_conditions && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Stethoscope className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-900">Medical Conditions</span>
                    </div>
                    <p className="text-sm text-yellow-700">{patient.medical_conditions}</p>
                  </div>
                )}

                {patient.medications && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Activity className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Current Medications</span>
                    </div>
                    <p className="text-sm text-blue-700">{patient.medications}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Emergency Contact
              </h4>
              <div className="text-sm text-orange-700">
                <p className="font-medium">{patient.emergency_contact_name}</p>
                {patient.emergency_contact_phone && (
                  <p className="mt-1">{patient.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Statistics */}
      {details && details.stats.totalRecords > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Medical Record Statistics
            </CardTitle>
            <CardDescription>
              Overview of patient's medical history and records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{details.stats.totalRecords}</div>
                <div className="text-sm text-blue-700">Total Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{details.stats.totalAppointments}</div>
                <div className="text-sm text-green-700">Appointments</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(details.stats.recordsByCategory).length}
                </div>
                <div className="text-sm text-purple-700">Categories</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {details.stats.appointmentsByStatus.completed || 0}
                </div>
                <div className="text-sm text-orange-700">Completed</div>
              </div>
            </div>

            {/* Records by Category */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Records by Category</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(details.stats.recordsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm capitalize">{category.replace('-', ' ')}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const OriginalPatientDetails = ({ patient }: { patient: PatientType }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <CardTitle className="text-xl">
                {patient.first_name} {patient.last_name}
              </CardTitle>
              <CardDescription className="font-mono">
                MED ID: {patient.med_id}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary">Patient</Badge>
            <p className="text-xs text-gray-500 mt-1">
              Joined {new Date(patient.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Age:</span>
                <span className="ml-auto">{formatAge(patient.date_of_birth || '')}</span>
              </div>
              {patient.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-auto">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-auto">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <span className="text-gray-600">Address:</span>
                  <span className="ml-auto text-right">{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Medical Information</h4>
            <div className="space-y-2 text-sm">
              {patient.blood_group && (
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Blood Type:</span>
                  <span className="ml-auto">{patient.blood_group}</span>
                </div>
              )}
            </div>

            {patient.allergies && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="font-medium text-red-900">Allergies</span>
                </div>
                <p className="text-sm text-red-700">{patient.allergies}</p>
              </div>
            )}

            {patient.medical_conditions && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-1">
                  <Stethoscope className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-900">Medical Conditions</span>
                </div>
                <p className="text-sm text-yellow-700">{patient.medical_conditions}</p>
              </div>
            )}

            {patient.medications && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-1">
                  <Activity className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Current Medications</span>
                </div>
                <p className="text-sm text-blue-700">{patient.medications}</p>
              </div>
            )}
          </div>
        </div>

        {patient.emergency_contact_name && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
            <div className="text-sm text-gray-600">
              <p><strong>{patient.emergency_contact_name}</strong></p>
              {patient.emergency_contact_phone && <p>{patient.emergency_contact_phone}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Search</h1>
          <p className="text-gray-600">Search and access patient medical records</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Scan MED ID
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Patients
          </CardTitle>
          <CardDescription>
            Search by MED ID for exact match, or by name, phone, or email for multiple results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter MED ID (e.g., CT123456ABC) or search by name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Search Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
                <strong>MED ID:</strong> Enter exact MED ID for direct patient lookup
              </div>
              <div className="text-xs text-gray-500 p-2 bg-green-50 rounded">
                <strong>Name:</strong> Search by first name or last name
              </div>
              <div className="text-xs text-gray-500 p-2 bg-purple-50 rounded">
                <strong>Contact:</strong> Search by phone number or email
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedPatient && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Search Results ({searchResults.length} found)
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </div>
      )}

      {/* Selected Patient Details */}
      {selectedPatient && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Patient Details</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Back to Search
              </Button>
            </div>
          </div>

          <PatientDetails patient={selectedPatient} details={patientDetails} />

          {/* Patient Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Medical Records
                {patientRecords.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {patientRecords.length} records
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Patient's medical history and uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : patientRecords.length > 0 ? (
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recent">Recent Records</TabsTrigger>
                    <TabsTrigger value="all">All Records</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="recent" className="space-y-3 mt-4">
                    {patientRecords.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            record.category === 'prescription' && "bg-blue-100 text-blue-600",
                            record.category === 'lab-report' && "bg-green-100 text-green-600",
                            record.category === 'medical-bill' && "bg-yellow-100 text-yellow-600",
                            record.category === 'scan-report' && "bg-purple-100 text-purple-600",
                            record.category === 'consultation' && "bg-pink-100 text-pink-600",
                            !['prescription', 'lab-report', 'medical-bill', 'scan-report', 'consultation'].includes(record.category) && "bg-gray-100 text-gray-600"
                          )}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.title}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{new Date(record.created_at).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {record.category.replace('-', ' ')}
                              </Badge>
                              {record.urgency_level && (
                                <Badge 
                                  variant={record.urgency_level === 'high' ? 'destructive' : 
                                          record.urgency_level === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {record.urgency_level} priority
                                </Badge>
                              )}
                            </div>
                            {record.summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{record.summary}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.file_url && (
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="all" className="space-y-3 mt-4">
                    {patientRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            record.category === 'prescription' && "bg-blue-100 text-blue-600",
                            record.category === 'lab-report' && "bg-green-100 text-green-600",
                            record.category === 'medical-bill' && "bg-yellow-100 text-yellow-600",
                            record.category === 'scan-report' && "bg-purple-100 text-purple-600",
                            record.category === 'consultation' && "bg-pink-100 text-pink-600",
                            !['prescription', 'lab-report', 'medical-bill', 'scan-report', 'consultation'].includes(record.category) && "bg-gray-100 text-gray-600"
                          )}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.title}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{new Date(record.created_at).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {record.category.replace('-', ' ')}
                              </Badge>
                            </div>
                            {record.summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{record.summary}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.file_url && (
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No medical records found</p>
                  <p className="text-xs">This patient hasn't uploaded any records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !selectedPatient && searchTerm && !isSearching && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600 mb-6">
            No patients match your search criteria. Please try a different search term.
          </p>
        </div>
      )}

      {/* Initial State */}
      {searchResults.length === 0 && !selectedPatient && !searchTerm && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Patients</h3>
          <p className="text-gray-600 mb-6">
            Use the search bar above to find patients by their MED ID, name, or contact information.
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => setShowScanner(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan MED ID
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
