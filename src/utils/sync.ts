import { getQueue, removeFromQueue, isConnected } from './offline';
import * as jobsApi from '../api/jobs';
import * as timeApi from '../api/timeTracking';

type SyncResult = { success: number; failed: number };

export async function syncOfflineActions(): Promise<SyncResult> {
  const online = await isConnected();
  if (!online) return { success: 0, failed: 0 };

  const queue = await getQueue();
  let success = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'complete_task':
          await jobsApi.completeTask(
            action.payload.jobId as number,
            action.payload.taskId as number
          );
          break;
        case 'update_status':
          await jobsApi.updateJobStatus(
            action.payload.jobId as number,
            action.payload.status as string
          );
          break;
        case 'clock_in':
          await timeApi.clockIn(action.payload.jobId as number);
          break;
        case 'clock_out':
          await timeApi.clockOut();
          break;
        case 'upload_photo':
          await jobsApi.uploadPhoto(
            action.payload.jobId as number,
            action.payload.uri as string
          );
          break;
        case 'upload_signature':
          await jobsApi.uploadSignature(
            action.payload.jobId as number,
            action.payload.base64 as string
          );
          break;
      }
      await removeFromQueue(action.id);
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}
