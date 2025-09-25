import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/medical_records_provider.dart';
import '../../providers/appointments_provider.dart';
import '../../config/theme_config.dart';

class StatsCardsWidget extends StatelessWidget {
  const StatsCardsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<MedicalRecordsProvider, AppointmentsProvider>(
      builder: (context, recordsProvider, appointmentsProvider, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Overview',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: ThemeConfig.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatsCard(
                    context,
                    title: 'Total Records',
                    value: recordsProvider.totalRecords.toString(),
                    icon: Icons.folder_outlined,
                    color: ThemeConfig.primaryBlue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatsCard(
                    context,
                    title: 'Appointments',
                    value: appointmentsProvider.upcomingAppointments.toString(),
                    icon: Icons.calendar_month,
                    color: ThemeConfig.successGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatsCard(
                    context,
                    title: 'Urgent Records',
                    value: recordsProvider.urgentRecords.toString(),
                    icon: Icons.warning_outlined,
                    color: ThemeConfig.warningYellow,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatsCard(
                    context,
                    title: 'Today',
                    value: appointmentsProvider.todayAppointments.toString(),
                    icon: Icons.today,
                    color: ThemeConfig.infoBlue,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatsCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ThemeConfig.borderLight),
        boxShadow: const [
          BoxShadow(
            color: ThemeConfig.cardShadowColor,
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 16,
                ),
              ),
              const Spacer(),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: ThemeConfig.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: ThemeConfig.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}