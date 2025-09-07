import React from 'react';

const DashboardPage: React.FC = () => {
  const username = localStorage.getItem('username') || 'User';

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {username}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { title: 'Total Projects', value: '12', change: '+2.5%', color: 'notion-blue' },
          { title: 'Active Users', value: '1,234', change: '+12.3%', color: 'notion-green' },
          { title: 'Revenue', value: '$45,678', change: '+8.1%', color: 'notion-purple' },
          { title: 'Tasks Done', value: '89', change: '+15.2%', color: 'notion-orange' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-surface p-6 rounded-lg border border-border shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                <div className={`w-6 h-6 bg-${stat.color} rounded`}></div>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-accent font-medium">{stat.change}</span>
              <span className="text-sm text-accent-foreground ml-1">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { action: 'Created new project', time: '2 hours ago', user: 'John Doe' },
              { action: 'Updated user settings', time: '4 hours ago', user: 'Jane Smith' },
              { action: 'Completed task review', time: '6 hours ago', user: 'Bob Johnson' },
              { action: 'Added new team member', time: '1 day ago', user: 'Alice Brown' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-notion-gray-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;