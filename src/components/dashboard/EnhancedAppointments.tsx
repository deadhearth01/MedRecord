'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Bell,
  Filter
} from 'lucide-react';
import {
  EnhancedAppointment,
  DoctorAvailability,
  createEnhancedAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  getDoctorAvailability,
  setDoctorAvailability,
  searchAvailableDoctors
} from '@/lib/supabase';

interface EnhancedAppointmentsProps {
  userId: string;
  userType: 'citizen' | 'doctor';
}

export default function EnhancedAppointments({ userId, userType }: EnhancedAppointmentsProps) {
  const [appointments, setAppointments] = useState<EnhancedAppointment[]>([]);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    appointment_type: 'consultation' as const,
    meeting_type: 'in-person' as const,
    notes: '',
    patient_notes: ''
  });

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      case 'rescheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Meeting type icons
  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoading(true);
      if (userType === 'doctor') {
        const { data, error } = await getDoctorAppointments(userId);
        if (error) throw error;
        setAppointments(data || []);
      } else {
        const { data, error } = await getPatientAppointments(userId);
        if (error) throw error;
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load doctor availability (for doctors)
  const loadAvailability = async () => {
    if (userType !== 'doctor') return;
    
    try {
      const { data, error } = await getDoctorAvailability(userId);
      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  // Load available doctors (for patients)
  const loadDoctors = async () => {
    if (userType !== 'citizen') return;
    
    try {
      const { data, error } = await searchAvailableDoctors();
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadAvailability();
    loadDoctors();
  }, [userId, userType]);

  // Filter appointments by status
  const filteredAppointments = appointments.filter(apt => {
    const now = new Date();
    const aptDate = new Date(apt.appointment_date);
    
    switch (activeTab) {
      case 'upcoming':
        return aptDate >= now && ['pending', 'confirmed'].includes(apt.status);
      case 'past':
        return aptDate < now || ['completed', 'cancelled', 'no-show'].includes(apt.status);
      case 'all':
        return true;
      default:
        return true;
    }
  });

  // Book appointment
  const handleBookAppointment = async () => {
    try {
      const appointmentData = {
        ...appointmentForm,
        patient_id: userId
      };

      const { data, error } = await createEnhancedAppointment(appointmentData);
      if (error) throw error;

      await loadAppointments();
      setBookingModalOpen(false);
      setAppointmentForm({
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        duration_minutes: 30,
        appointment_type: 'consultation',
        meeting_type: 'in-person',
        notes: '',
        patient_notes: ''
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  // Days of week for availability
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Enhanced Appointments</h2>
            <p className="text-gray-600">
              {userType === 'doctor' ? 'Manage your patient appointments' : 'Book and manage your appointments'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {userType === 'doctor' && (
            <Button variant="outline" onClick={() => setAvailabilityModalOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
          )}
          {userType === 'citizen' && (
            <Button onClick={() => setBookingModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Appointments List */}
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getMeetingIcon(appointment.meeting_type)}
                        <CardTitle className="text-lg">
                          {appointment.appointment_type.charAt(0).toUpperCase() + appointment.appointment_type.slice(1)}
                        </CardTitle>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                      <Clock className="h-4 w-4 ml-2" />
                      {appointment.appointment_time}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {userType === 'doctor' ? 'Patient' : 'Doctor'}: 
                          <span className="ml-2 text-gray-600">
                            {/* This would be populated from the join query */}
                            Dr. Smith / John Doe
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration: {appointment.duration_minutes} minutes
                        </p>
                        {appointment.fee && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Fee: ${appointment.fee}
                          </p>
                        )}
                      </div>
                      
                      {appointment.meeting_type === 'video' && appointment.meeting_link && (
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Notes:</p>
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.patient_notes && userType === 'doctor' && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">Patient Notes:</p>
                        <p className="text-sm text-blue-600">{appointment.patient_notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {appointment.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Appointments Found</h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'upcoming' 
                    ? 'You have no upcoming appointments.'
                    : activeTab === 'past' 
                    ? 'No past appointments found.'
                    : 'No appointments found.'}
                </p>
                {userType === 'citizen' && (
                  <Button onClick={() => setBookingModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Book Appointment Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with your healthcare provider.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctor">Select Doctor</Label>
                <select
                  id="doctor"
                  className="w-full p-2 border rounded-md"
                  value={appointmentForm.doctor_id}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name} - {doctor.doctor_profile?.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="appointment-type">Appointment Type</Label>
                <select
                  id="appointment-type"
                  className="w-full p-2 border rounded-md"
                  value={appointmentForm.appointment_type}
                  onChange={(e) => setAppointmentForm(prev => ({ 
                    ...prev, 
                    appointment_type: e.target.value as any 
                  }))}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="checkup">Check-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>

              <div>
                <Label htmlFor="appointment-date">Date</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentForm.appointment_date}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="appointment-time">Time</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={appointmentForm.appointment_time}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="meeting-type">Meeting Type</Label>
                <select
                  id="meeting-type"
                  className="w-full p-2 border rounded-md"
                  value={appointmentForm.meeting_type}
                  onChange={(e) => setAppointmentForm(prev => ({ 
                    ...prev, 
                    meeting_type: e.target.value as any 
                  }))}
                >
                  <option value="in-person">In-Person</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={appointmentForm.duration_minutes}
                  onChange={(e) => setAppointmentForm(prev => ({ 
                    ...prev, 
                    duration_minutes: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="patient-notes">Notes for Doctor</Label>
              <Textarea
                id="patient-notes"
                placeholder="Describe your symptoms or reason for visit..."
                value={appointmentForm.patient_notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, patient_notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookAppointment}>
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Availability Modal */}
      {userType === 'doctor' && (
        <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Set Your Availability</DialogTitle>
              <DialogDescription>
                Configure your weekly schedule for patient appointments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {daysOfWeek.map((day, index) => (
                <Card key={day}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`start-${index}`}>Start Time</Label>
                        <Input
                          id={`start-${index}`}
                          type="time"
                          defaultValue="09:00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${index}`}>End Time</Label>
                        <Input
                          id={`end-${index}`}
                          type="time"
                          defaultValue="17:00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`break-start-${index}`}>Break Start</Label>
                        <Input
                          id={`break-start-${index}`}
                          type="time"
                          defaultValue="12:00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`break-end-${index}`}>Break End</Label>
                        <Input
                          id={`break-end-${index}`}
                          type="time"
                          defaultValue="13:00"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAvailabilityModalOpen(false)}>
                Cancel
              </Button>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                Save Availability
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
