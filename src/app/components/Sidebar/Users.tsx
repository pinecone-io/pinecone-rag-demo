import type { User } from '@clerk/nextjs/dist/types/server';
import { useEffect, useState } from 'react';

interface CheckboxState {
  general: boolean;
  hr: boolean;
  finance: boolean;
}

export interface UserDataAssignments {
  [userId: string]: CheckboxState;
}

export const ListAllUsers: React.FC<{ updateUserDataAssignments: React.Dispatch<React.SetStateAction<UserDataAssignments>> }> = ({ updateUserDataAssignments }) => {
  
  const [users, setUsers] = useState<User[]>([]);
  const [isAllowed, setIsAllowed] = useState(true);
  const [checkboxStates, setCheckboxStates] = useState<UserDataAssignments>({});
  const [usersLoading, setUsersLoading] = useState(true);
  useEffect(() => {
    updateUserDataAssignments(checkboxStates);
  }, [checkboxStates, updateUserDataAssignments]);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true); // Set loading state to true at the beginning of the fetch operation
      try {
        const response = await fetch('/api/users', {
          method: 'POST'
        });
        const data = await response.json();
        if (data.success === false) {
          setIsAllowed(false);
        } else {
          setUsers(data);
          // Initialize checkbox states for fetched users
          const initialStates: UserDataAssignments = {};
          data.forEach((user: User) => {
            initialStates[user.id] = { general: false,
              hr: false,
              finance: false };
          });
          setCheckboxStates(initialStates);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false); // Set loading state to false at the end of the fetch operation regardless of the outcome
      }
    };
    fetchUsers();
  }, []);

  const handleCheckboxChange = (userId: string, field: keyof CheckboxState, value: boolean) => {
    setCheckboxStates(prevState => ({
      ...prevState,
      [userId]: {
        ...prevState[userId],
        [field]: value,
      },
    }));
  };

  if (!isAllowed) {
    return null;
  }

  if (usersLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="shadow-lg rounded-lg overflow-hidden mt-3">
      <table className="min-w-full leading-normal">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-3 text-left">Email</th>
            <th className="py-3 px-3 text-center">General</th>
            <th className="py-3 px-3 text-center">HR</th>
            <th className="py-3 px-3 text-center">Finance</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-3 text-left whitespace-nowrap">{user.emailAddresses[0].emailAddress}</td>
              <td className="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-gray-600"
                  checked={checkboxStates[user.id]?.general}
                  onChange={(e) => handleCheckboxChange(user.id, 'general', e.target.checked)}
                />
              </td>
              <td className="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-gray-600"
                  checked={checkboxStates[user.id]?.hr}
                  onChange={(e) => handleCheckboxChange(user.id, 'hr', e.target.checked)}
                />
              </td>
              <td className="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-gray-600"
                  checked={checkboxStates[user.id]?.finance}
                  onChange={(e) => handleCheckboxChange(user.id, 'finance', e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
