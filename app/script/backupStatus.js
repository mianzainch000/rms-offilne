let lastSuccessfulBackupAt = null;
let lastSyncStatusDetail = "Abhi tak koi cloud sync attempt nahi hua.";

function setStatus(detail, successAt) {
  lastSyncStatusDetail = detail;
  if (successAt) lastSuccessfulBackupAt = successAt;
}

function getStatus() {
  return {
    lastSuccessfulBackupAt,
    lastSyncStatusDetail,
  };
}

module.exports = { setStatus, getStatus };
