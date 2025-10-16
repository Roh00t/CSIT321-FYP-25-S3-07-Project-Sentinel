// frontend/src/components/TeamManagement.tsx
import { useState, useEffect } from 'react';

interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string | null;
  is_owner: boolean;
}

interface Team {
  id: number;
  name: string;
  owner_id: number;
  owner_name: string | null;
  created_at: string;
}

interface TeamData {
  team: Team;
  members: TeamMember[];
  current_user_role: string;
}

interface Props {
  token: string | null;
  onTeamUpdate: () => void;
}

export default function TeamManagement({ token, onTeamUpdate }: Props) {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const fetchTeam = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/teams', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setTeamData(data);
        }
      } catch (err) {
        console.error('Failed to fetch team:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inviteEmail) return;

    setInviting(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setInviteEmail('');
        onTeamUpdate();
      } else {
        setError(data.msg || 'Failed to invite user');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!token || !window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/teams/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        onTeamUpdate();
      } else {
        const data = await response.json();
        alert(data.msg || 'Failed to remove member');
      }
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  // ✅ New: Handle leaving the team
  const handleLeaveTeam = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to leave this team? You will lose access to all Team plan features and be downgraded to the Basic plan.')) {
      return;
    }

    setLeaving(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/teams/leave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.msg);
        onTeamUpdate(); // This will trigger a profile refresh in parent
      } else {
        alert(data.msg || 'Failed to leave team');
      }
    } catch (err) {
      alert('Network error while leaving team');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading team...</div>;
  }

  if (!teamData) {
    return <div className="text-gray-600">No team data available</div>;
  }

  // Determine if current user is the owner
  const currentUserId = getUserIdFromToken(token);
  const isOwner = currentUserId 
    ? teamData.members.some(m => m.user_id === parseInt(currentUserId, 10) && m.is_owner)
    : false;

  return (
    <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-xl font-semibold text-green-800 mb-4">Team Management</h3>
      
      <div className="mb-4">
        <h4 className="font-medium text-green-700">Team: {teamData.team.name}</h4>
        <p className="text-sm text-green-600">Owner: {teamData.team.owner_name}</p>
      </div>

      {/* Invite Form */}
      {teamData.current_user_role === 'admin' && (
        <div className="mb-6">
          <h4 className="font-medium text-green-700 mb-2">Invite Team Members</h4>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={inviting}
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          <p className="text-sm text-gray-600 mt-2">
            Team members will have access to all Team plan features. Maximum 5 members total.
          </p>
        </div>
      )}

      {/* Team Members List */}
      <div>
        <h4 className="font-medium text-green-700 mb-2">Team Members ({teamData.members.length}/5)</h4>
        <div className="space-y-2">
          {teamData.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
                <p className="text-xs text-gray-500">
                  {member.role === 'admin' ? 'Owner' : 'Member'}
                  {member.joined_at && ` • Joined ${new Date(member.joined_at).toLocaleDateString()}`}
                </p>
              </div>
              {teamData.current_user_role === 'admin' && !member.is_owner && (
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Leave Team Button (for non-owners) */}
      {!isOwner && (
        <div className="mt-6 pt-4 border-t border-green-200">
          <button
            onClick={handleLeaveTeam}
            disabled={leaving}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 text-sm"
          >
            {leaving ? 'Leaving...' : 'Leave Team'}
          </button>
          <p className="text-xs text-gray-600 mt-2">
            Leaving the team will downgrade your account to the Basic plan.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper to extract user ID from JWT (simple base64 decode)
function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = JSON.parse(decoded);
    return json.sub || null;
  } catch (e) {
    console.warn('Failed to parse JWT');
    return null;
  }
}