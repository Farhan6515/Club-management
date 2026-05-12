import toast from 'react-hot-toast';

const BADGE_LABEL = {
  early_bird:       '🐦 Early Bird',
  top_contributor:  '✍️ Top Contributor',
  event_master:     '🎉 Event Master',
  comment_king:     '💬 Comment King',
  streak_hero:      '🔥 Streak Hero',
  streak_legend:    '⚡ Streak Legend',
  social_butterfly: '🦋 Social Butterfly',
  popular:          '❤️ Popular',
};

const REASON_LABEL = {
  JOIN_CLUB:    'Joined a club',
  CREATE_POST:  'Posted an activity',
  CREATE_EVENT: 'Created an event',
  ADD_COMMENT:  'Left a comment',
  RECEIVE_LIKE: 'Post liked',
  DAILY_LOGIN:  'Daily login',
  STREAK_7:     '7-day streak bonus',
  STREAK_30:    '30-day streak bonus',
};

export function showPointsToast(pointsInfo) {
  if (!pointsInfo) return;

  const { points, action, leveledUp, levelName, newBadges = [], streak, streakBonus } = pointsInfo;

  // Points earned toast
  if (points > 0) {
    const reason = REASON_LABEL[action] || action;
    toast.success(`+${points} pts · ${reason}`, {
      icon: '⭐',
      style: {
        background: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        fontWeight: 600,
        fontSize: '14px',
      },
      duration: 3000,
    });
  }

  // Streak bonus
  if (streakBonus) {
    setTimeout(() => {
      toast(`🔥 ${streak}-day streak! +${streakBonus} bonus pts`, {
        style: {
          background: '#1e293b',
          color: '#fb923c',
          border: '1px solid #ea580c',
          fontWeight: 700,
          fontSize: '14px',
        },
        duration: 4000,
      });
    }, 600);
  }

  // Level up
  if (leveledUp && levelName) {
    setTimeout(() => {
      toast(`🎉 Level Up! You're now ${levelName}`, {
        style: {
          background: '#1e1b4b',
          color: '#a5b4fc',
          border: '1px solid #6366f1',
          fontWeight: 700,
          fontSize: '14px',
        },
        duration: 5000,
      });
    }, 900);
  }

  // New badges
  newBadges.forEach((badge, i) => {
    setTimeout(() => {
      toast(`🏆 New badge: ${BADGE_LABEL[badge] || badge}`, {
        style: {
          background: '#1c1a0f',
          color: '#fbbf24',
          border: '1px solid #d97706',
          fontWeight: 700,
          fontSize: '14px',
        },
        duration: 5000,
      });
    }, 1200 + i * 600);
  });
}
