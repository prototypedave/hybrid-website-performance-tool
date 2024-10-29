import { CogIcon, CloudIcon, FingerPrintIcon, LockClosedIcon, BoltIcon } from '@heroicons/react/24/outline'
import Navbar from './Navbar';

const features = [
    {
      name: 'Performance Analysis',
      description:
        'Evaluates the speed, efficiency, and reliability of systems or applications, identifying bottlenecks and optimizing resource usage for smoother user experiences.',
      icon: BoltIcon,
    },
    {
      name: 'Network Analysis',
      description:
        'Monitors and assesses network traffic, connectivity, and data flow to ensure optimal performance, security, and fault detection within interconnected systems.',
      icon: CloudIcon,
    },
    {
      name: 'Security Analysis',
      description:
        'Examines systems and data to identify vulnerabilities, protect against unauthorized access, and ensure compliance with security protocols to guard sensitive information.',
      icon: LockClosedIcon,
    },
    {
      name: 'Threat Automation',
      description:
        'Automates the detection, response, and mitigation of security threats using AI and machine learning, enhancing response speed and reducing the impact of potential cyber attacks.',
      icon: CogIcon,
    },
]
  
export function Features() {
    return (
      <>
        <Navbar />
        <div className="bg-white py-4 sm:py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base/7 font-semibold text-indigo-600">Insights. Optimize. Succeed."</h2>
            <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-balance">
              Everything you need to monitor your website
            </p>
            <p className="mt-6 text-lg/8 text-gray-600">
                Empowering websites with real-time insights to boost performance, enhance security, and drive user engagement.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <feature.icon aria-hidden="true" className="h-6 w-6 text-white" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base/7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
      
    )
}