'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar,
  Clock,
  Plus,
  Search,
  MapPin,
  Phone,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MessageSquare
} from 'lucide-react';
import { type User, getAppointments, createAppointment, type Appointment } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AppointmentsProps {
  user: User;
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
  'no-show': { label: 'No Show', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
};

export default function Appointments({ user }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    appointment_date: '',
    appointment_time: '',
    doctor_name: '',
    location: '',
    notes: '',
    appointment_type: 'in-person' as 'in-person' | 'video' | 'phone'
  });

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const { data } = await getAppointments(user.id);
        if (data) {
          setAppointments(data);
          filterAppointments(data, activeTab, searchTerm);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [user.id]);

  const filterAppointments = (appts: Appointment[], tab: string, search: string) => {
    let filtered = appts;

    // Filter by tab
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (tab) {
      case 'upcoming':
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
        });
        break;
      case 'past':
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate < today || apt.status === 'completed';
        });
        break;
      case 'cancelled':
        filtered = filtered.filter(apt => apt.status === 'cancelled');
        break;
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(apt =>
        apt.title.toLowerCase().includes(search.toLowerCase()) ||
        apt.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
        apt.location?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    filterAppointments(appointments, activeTab, searchTerm);
  }, [appointments, activeTab, searchTerm]);

  const handleCreateAppointment = async () => {
    if (!newAppointment.title || !newAppointment.appointment_date || !newAppointment.appointment_time) {
      return;
    }

    setIsCreating(true);
    try {
      const { data: appointment } = await createAppointment({
        ...newAppointment,
        user_id: user.id,
        status: 'scheduled'
      });

      if (appointment) {
        setAppointments(prev => [appointment, ...prev]);
      }
      setNewAppointment({
        title: '',
        appointment_date: '',
        appointment_time: '',
        doctor_name: '',
        location: '',
        notes: '',
        appointment_type: 'in-person'
      });
      setShowNewAppointment(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const status = statusConfig[appointment.status as keyof typeof statusConfig];
    const StatusIcon = status?.icon || Clock;
    const isUpcoming = new Date(appointment.appointment_date) >= new Date();

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-medium mb-1">
                {appointment.title}
              </CardTitle>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(appointment.appointment_date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {appointment.appointment_time}
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs', status?.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status?.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {appointment.doctor_name && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Stethoscope className="h-4 w-4 mr-2" />
              Dr. {appointment.doctor_name}
            </div>
          )}

          {appointment.location && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              {appointment.location}
            </div>
          )}

          {appointment.appointment_type && appointment.appointment_type !== 'in-person' && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              {appointment.appointment_type === 'video' ? (
                <Video className="h-4 w-4 mr-2" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              {appointment.appointment_type === 'video' ? 'Video Call' : 'Phone Call'}
            </div>
          )}

          {appointment.notes && (
            <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
              {appointment.notes}
            </p>
          )}

          <div className="flex space-x-2">
            {isUpcoming && appointment.status !== 'cancelled' && (
              <>
                <Button size="sm" variant="outline" className="flex-1">
                  Reschedule
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </>
            )}
            {appointment.appointment_type === 'video' && isUpcoming && (
              <Button size="sm" className="flex-1">
                <Video className="h-4 w-4 mr-1" />
                Join Call
              </Button>
            )}
            {!isUpcoming && appointment.status === 'completed' && (
              <Button size="sm" variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-1" />
                View Summary
              </Button>
            )}
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your healthcare appointments</p>
        </div>
        
        <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Book a new appointment with your healthcare provider
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Appointment Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., General Checkup"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment(prev => ({...prev, title: e.target.value}))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.appointment_date}
                    onChange={(e) => setNewAppointment(prev => ({...prev, appointment_date: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.appointment_time}
                    onChange={(e) => setNewAppointment(prev => ({...prev, appointment_time: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="doctor">Doctor Name</Label>
                <Input
                  id="doctor"
                  placeholder="Dr. Smith"
                  value={newAppointment.doctor_name}
                  onChange={(e) => setNewAppointment(prev => ({...prev, doctor_name: e.target.value}))}
                />
              </div>

              <div>
                <Label htmlFor="location">Location/Clinic</Label>
                <Input
                  id="location"
                  placeholder="City Hospital, Room 201"
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment(prev => ({...prev, location: e.target.value}))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  rows={3}
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({...prev, notes: e.target.value}))}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAppointment}
                  disabled={isCreating || !newAppointment.title || !newAppointment.appointment_date}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : 'Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming
            <Badge variant="secondary" className="ml-2">
              {appointments.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                const today = new Date();
                return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
              }).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
            <Badge variant="secondary" className="ml-2">
              {appointments.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                const today = new Date();
                return aptDate < today || apt.status === 'completed';
              }).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            <Badge variant="secondary" className="ml-2">
              {appointments.filter(apt => apt.status === 'cancelled').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? 'No appointments found' 
                  : `No ${activeTab} appointments`
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : `You don't have any ${activeTab} appointments at the moment`
                }
              </p>
              {!searchTerm && activeTab === 'upcoming' && (
                <Button onClick={() => setShowNewAppointment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
