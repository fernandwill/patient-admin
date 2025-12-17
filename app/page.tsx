import ContentWrapper from '@/components/layout/ContentWrapper';

export default function Home() {
  return (
    <ContentWrapper title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Small Box: New Orders */}
        <div className="bg-blue-500 text-white rounded shadow p-4 relative overflow-hidden">
          <div className="inner">
            <h3 className="text-3xl font-bold">150</h3>
            <p>New Registrations</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-user-plus text-6xl"></i>
          </div>
          <a href="#" className="block mt-4 text-center text-sm bg-blue-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            More info <i className="fas fa-arrow-circle-right"></i>
          </a>
        </div>

        {/* Small Box: Bounce Rate */}
        <div className="bg-green-500 text-white rounded shadow p-4 relative overflow-hidden">
          <div className="inner">
            <h3 className="text-3xl font-bold">53<sup className="text-xl">%</sup></h3>
            <p>Bounce Rate</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-chart-bar text-6xl"></i>
          </div>
          <a href="#" className="block mt-4 text-center text-sm bg-green-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            More info <i className="fas fa-arrow-circle-right"></i>
          </a>
        </div>

        {/* Small Box: User Registrations */}
        <div className="bg-yellow-500 text-white rounded shadow p-4 relative overflow-hidden">
          <div className="inner">
            <h3 className="text-3xl font-bold">44</h3>
            <p>User Registrations</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-user-plus text-6xl"></i>
          </div>
          <a href="#" className="block mt-4 text-center text-sm bg-yellow-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            More info <i className="fas fa-arrow-circle-right"></i>
          </a>
        </div>

        {/* Small Box: Unique Visitors */}
        <div className="bg-red-500 text-white rounded shadow p-4 relative overflow-hidden">
          <div className="inner">
            <h3 className="text-3xl font-bold">65</h3>
            <p>Unique Visitors</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-chart-pie text-6xl"></i>
          </div>
          <a href="#" className="block mt-4 text-center text-sm bg-red-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            More info <i className="fas fa-arrow-circle-right"></i>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Latest Patients</h3>
          <p className="text-gray-500">List of latest patients...</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Recent Activity</h3>
          <p className="text-gray-500">Recent activity log...</p>
        </div>
      </div>
    </ContentWrapper>
  );
}
