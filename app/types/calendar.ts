export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'youth-class' | 'game' | 'practice' | 'community' | 'other';
  host?: string;
}

export interface EventTypeConfig {
  color: string;
  label: string;
  textColor: string;
  icon: string;
}