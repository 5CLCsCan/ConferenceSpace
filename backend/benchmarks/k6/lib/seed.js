export function parseSeedSummary() {
  if (!__ENV.SEED_SUMMARY) return null;
  try {
    return JSON.parse(__ENV.SEED_SUMMARY);
  } catch (e) {
    return null;
  }
}

export function pickConferenceID() {
  if (__ENV.CONF_ID) return __ENV.CONF_ID;
  const summary = parseSeedSummary();
  const ids = summary?.conference_ids;
  if (ids && ids.length) {
    return String(ids[Math.floor(Math.random() * ids.length)]);
  }
  return '1';
}

export function pickReviewerID() {
  if (__ENV.REVIEWER_ID) return __ENV.REVIEWER_ID;
  const summary = parseSeedSummary();
  const ids = summary?.reviewer_ids;
  if (ids && ids.length) {
    return String(ids[Math.floor(Math.random() * ids.length)]);
  }
  return '1';
}

export function pickAuthorEmail() {
  if (__ENV.AUTHOR_EMAIL) return __ENV.AUTHOR_EMAIL;
  const summary = parseSeedSummary();
  if (summary?.author_email) return summary.author_email;
  const emails = summary?.reviewer_emails;
  if (emails && emails.length > 1) {
    return emails[Math.floor(Math.random() * emails.length)];
  }
  return 'bench-reviewer-1@example.com';
}

// pickCOITarget returns a {conference_id, reviewer_id, author_email} triple where
// the reviewer belongs to the conference, so the coi-check request is valid.
export function pickCOITarget() {
  const summary = parseSeedSummary();
  const targets = summary?.coi_targets;
  if (targets && targets.length) {
    const t = targets[Math.floor(Math.random() * targets.length)];
    return {
      confID: __ENV.CONF_ID || String(t.conference_id),
      reviewerID: __ENV.REVIEWER_ID || String(t.reviewer_id),
      authorEmail: __ENV.AUTHOR_EMAIL || t.author_email,
    };
  }
  return {
    confID: pickConferenceID(),
    reviewerID: pickReviewerID(),
    authorEmail: pickAuthorEmail(),
  };
}
