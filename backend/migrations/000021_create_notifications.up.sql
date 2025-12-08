-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    conference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_user_email_read ON notifications(user_email, read);
CREATE INDEX idx_notifications_user_email_created_at ON notifications(user_email, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_conference_id ON notifications(conference_id);

-- Create notification_preferences table for user notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    submission_received BOOLEAN DEFAULT TRUE,
    review_assigned BOOLEAN DEFAULT TRUE,
    review_submitted BOOLEAN DEFAULT TRUE,
    paper_accepted BOOLEAN DEFAULT TRUE,
    paper_rejected BOOLEAN DEFAULT TRUE,
    deadline_reminder BOOLEAN DEFAULT TRUE,
    status_change BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notification preferences
CREATE INDEX idx_notification_preferences_user_email ON notification_preferences(user_email);

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for conference events';
COMMENT ON TABLE notification_preferences IS 'Stores user preferences for notification types';
COMMENT ON COLUMN notifications.type IS 'Type of notification: submission_received, review_assigned, review_submitted, paper_accepted, paper_rejected, deadline_reminder, status_change';
COMMENT ON COLUMN notifications.metadata IS 'Additional JSON data specific to the notification type (e.g., submission_id, conference_id)';

