import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/medical_records_provider.dart';
import '../../config/theme_config.dart';
import '../../models/medical_record_model.dart';

class RecentRecordsWidget extends StatelessWidget {
  const RecentRecordsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<MedicalRecordsProvider>(
      builder: (context, recordsProvider, child) {
        final recentRecords = recordsProvider.records.take(5).toList();
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Records',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: ThemeConfig.textPrimary,
                  ),
                ),
                if (recordsProvider.records.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      // Navigate to all records
                    },
                    child: const Text('View All'),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            
            if (recordsProvider.isLoading) ...[
              _buildShimmerLoading(),
            ] else if (recentRecords.isEmpty) ...[
              _buildEmptyState(context),
            ] else ...[
              ...recentRecords.map((record) => _buildRecordCard(context, record)),
            ],
          ],
        );
      },
    );
  }

  Widget _buildRecordCard(BuildContext context, MedicalRecordModel record) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getCategoryColor(record.categoryEnum).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getCategoryIcon(record.categoryEnum),
                  color: _getCategoryColor(record.categoryEnum),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record.title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: ThemeConfig.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      record.categoryEnum.displayName,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: ThemeConfig.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (record.urgencyLevel == UrgencyLevel.high)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: ThemeConfig.errorRed.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Urgent',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: ThemeConfig.errorRed,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          
          if (record.description != null) ...[
            const SizedBox(height: 12),
            Text(
              record.description!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: ThemeConfig.textSecondary,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Icon(
                Icons.access_time,
                color: ThemeConfig.textMuted,
                size: 14,
              ),
              const SizedBox(width: 4),
              Text(
                DateFormat('MMM d, y').format(record.createdAt),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: ThemeConfig.textMuted,
                ),
              ),
              
              if (record.hasFile) ...[
                const SizedBox(width: 16),
                Icon(
                  Icons.attach_file,
                  color: ThemeConfig.textMuted,
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  record.formattedFileSize,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: ThemeConfig.textMuted,
                  ),
                ),
              ],
              
              const Spacer(),
              
              Icon(
                Icons.arrow_forward_ios,
                color: ThemeConfig.textMuted,
                size: 14,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ThemeConfig.borderLight),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: ThemeConfig.backgroundGray,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.folder_outlined,
              color: ThemeConfig.textMuted,
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No medical records yet',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
              color: ThemeConfig.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Upload your first medical document to get started',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: ThemeConfig.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Column(
      children: List.generate(3, (index) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ThemeConfig.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: ThemeConfig.backgroundGray,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 16,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: ThemeConfig.backgroundGray,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        height: 12,
                        width: 100,
                        decoration: BoxDecoration(
                          color: ThemeConfig.backgroundGray,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      )),
    );
  }

  Color _getCategoryColor(RecordCategory category) {
    switch (category) {
      case RecordCategory.prescription:
        return ThemeConfig.primaryBlue;
      case RecordCategory.labReport:
        return ThemeConfig.successGreen;
      case RecordCategory.medicalBill:
        return ThemeConfig.warningYellow;
      case RecordCategory.scanReport:
        return ThemeConfig.primaryIndigo;
      case RecordCategory.consultation:
        return ThemeConfig.infoBlue;
      case RecordCategory.vaccination:
        return ThemeConfig.successGreen;
      case RecordCategory.vitalSigns:
        return ThemeConfig.errorRed;
      case RecordCategory.other:
        return ThemeConfig.textSecondary;
    }
  }

  IconData _getCategoryIcon(RecordCategory category) {
    switch (category) {
      case RecordCategory.prescription:
        return Icons.medication;
      case RecordCategory.labReport:
        return Icons.science;
      case RecordCategory.medicalBill:
        return Icons.receipt;
      case RecordCategory.scanReport:
        return Icons.image;
      case RecordCategory.consultation:
        return Icons.medical_services;
      case RecordCategory.vaccination:
        return Icons.vaccines;
      case RecordCategory.vitalSigns:
        return Icons.monitor_heart;
      case RecordCategory.other:
        return Icons.description;
    }
  }
}