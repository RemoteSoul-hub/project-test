@@ .. @@
 import { useState, useEffect, useMemo } from 'react';
 import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
+import ApiService from '@/services/apiService';
 
 // Component selection card
 const ComponentCard = ({ 
   title, 
@@ .. @@
 export default function ServerConfigurationStep({ onNext, setConfiguration, configuration }) {
   const [selectedCpu, setSelectedCpu] = useState(configuration?.cpu || null);
   const [selectedMemory, setSelectedMemory] = useState(configuration?.memory || null);
   const [selectedStorage, setSelectedStorage] = useState(configuration?.storage || null);
   const [selectedLocation, setSelectedLocation] = useState(configuration?.location || null);
   const [selectedOS, setSelectedOS] = useState(configuration?.os || null);
+  const [components, setComponents] = useState(null);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState(null);
   
   // Expanded sections
   const [expandedSections, setExpandedSections] = useState({
     cpu: true,
     memory: false,
     storage: false,
     location: false,
     os: false
   });
   
-  // Mock data for components
-  const components = {
-    cpu: [
-      { id: 'cpu-1', name: 'AMD Ryzen 5 7600', specs: '6 Cores / 12 Threads', price: 45.00 },
-      { id: 'cpu-2', name: 'Intel i9 13900K', specs: '24 Cores / 32 Threads', price: 85.00 },
-      { id: 'cpu-3', name: 'AMD EPYC 7351P', specs: '16 Cores / 32 Threads', price: 120.00 },
-      { id: 'cpu-4', name: 'Intel Xeon E5-2690', specs: '12 Cores / 24 Threads', price: 65.00 },
-      { id: 'cpu-5', name: 'Intel i7 11700K', specs: '8 Cores / 16 Threads', price: 55.00 },
-      { id: 'cpu-6', name: 'AMD Ryzen 9 7950X', specs: '16 Cores / 32 Threads', price: 95.00 },
-    ],
-    memory: [
-      { id: 'mem-1', name: '16GB RAM', specs: 'DDR4 3200MHz', price: 15.00 },
-      { id: 'mem-2', name: '32GB RAM', specs: 'DDR4 3200MHz', price: 28.00 },
-      { id: 'mem-3', name: '64GB RAM', specs: 'DDR4 3200MHz', price: 55.00 },
-      { id: 'mem-4', name: '128GB RAM', specs: 'DDR4 3200MHz', price: 110.00 },
-    ],
-    storage: [
-      { id: 'storage-1', name: '512GB SSD', specs: 'NVMe', price: 12.00 },
-      { id: 'storage-2', name: '1TB SSD', specs: 'NVMe', price: 20.00 },
-      { id: 'storage-3', name: '2TB SSD', specs: 'NVMe', price: 35.00 },
-      { id: 'storage-4', name: '4TB SSD', specs: 'NVMe', price: 65.00 },
-    ],
-    location: [
-      { id: 'loc-1', name: 'Amsterdam, NL', specs: 'Europe', price: 0 },
-      { id: 'loc-2', name: 'Frankfurt, DE', specs: 'Europe', price: 0 },
-      { id: 'loc-3', name: 'London, UK', specs: 'Europe', price: 0 },
-      { id: 'loc-4', name: 'New York, US', specs: 'North America', price: 0 },
-      { id: 'loc-5', name: 'Singapore, SG', specs: 'Asia', price: 0 },
-    ],
-    os: [
-      { id: 'os-1', name: 'Ubuntu 22.04', specs: 'Linux', price: 0 },
-      { id: 'os-2', name: 'Debian 11', specs: 'Linux', price: 0 },
-      { id: 'os-3', name: 'Windows Server 2022', specs: 'Windows', price: 15.00 },
-      { id: 'os-4', name: 'CentOS 7', specs: 'Linux', price: 0 },
-    ]
-  };
+  // Fetch components from API
+  useEffect(() => {
+    const fetchComponents = async () => {
+      try {
+        setLoading(true);
+        setError(null);
+        
+        const response = await ApiService.get('/components');
+        
+        if (response && response.data) {
+          // Transform the data to match our expected format
+          const transformedComponents = {
+            cpu: (response.data.cpu || []).map(cpu => ({
+              id: cpu.id,
+              name: cpu.name,
+              specs: cpu.specs?.cores ? `${cpu.specs.cores} Cores / ${cpu.specs.threads || cpu.specs.cores} Threads` : '',
+              price: cpu.custom_price !== null ? cpu.custom_price : cpu.base_price
+            })),
+            memory: (response.data.memory || []).map(mem => ({
+              id: mem.id,
+              name: `${mem.specs?.size || ''}GB RAM`,
+              specs: `${mem.specs?.type || 'DDR4'} ${mem.specs?.speed || ''}`,
+              price: mem.custom_price !== null ? mem.custom_price : mem.base_price
+            })),
+            storage: (response.data.storage || []).map(storage => ({
+              id: storage.id,
+              name: `${storage.specs?.size || ''}GB ${storage.specs?.displayType || 'Storage'}`,
+              specs: storage.specs?.interface || '',
+              price: storage.custom_price !== null ? storage.custom_price : storage.base_price
+            })),
+            location: (response.data.location || []).map(location => ({
+              id: location.id,
+              name: location.name,
+              specs: location.specs?.region || '',
+              price: 0 // Locations typically don't have a price
+            })),
+            operatingSystems: (response.data.operatingSystems || []).map(os => ({
+              id: os.id,
+              name: os.name,
+              specs: os.specs?.category || '',
+              price: os.custom_price !== null ? os.custom_price : os.base_price || 0
+            }))
+          };
+          
+          setComponents(transformedComponents);
+          
+          // Set default selections if none are already selected
+          if (!selectedCpu && transformedComponents.cpu?.length > 0) {
+            setSelectedCpu(transformedComponents.cpu[0]);
+          }
+          if (!selectedMemory && transformedComponents.memory?.length > 0) {
+            setSelectedMemory(transformedComponents.memory[0]);
+          }
+          if (!selectedStorage && transformedComponents.storage?.length > 0) {
+            setSelectedStorage(transformedComponents.storage[0]);
+          }
+          if (!selectedLocation && transformedComponents.location?.length > 0) {
+            setSelectedLocation(transformedComponents.location[0]);
+          }
+          if (!selectedOS && transformedComponents.operatingSystems?.length > 0) {
+            setSelectedOS(transformedComponents.operatingSystems[0]);
+          }
+        } else {
+          throw new Error('Invalid response format');
+        }
+      } catch (err) {
+        console.error('Error fetching components:', err);
+        setError('Failed to load server components. Please try again.');
+        
+        // Set fallback components
+        setComponents({
+          cpu: [{ id: 'cpu-1', name: 'Default CPU', specs: '4 Cores', price: 45.00 }],
+          memory: [{ id: 'mem-1', name: '16GB RAM', specs: 'DDR4', price: 15.00 }],
+          storage: [{ id: 'storage-1', name: '512GB SSD', specs: 'NVMe', price: 12.00 }],
+          location: [{ id: 'loc-1', name: 'Amsterdam, NL', specs: 'Europe', price: 0 }],
+          operatingSystems: [{ id: 'os-1', name: 'Ubuntu 22.04', specs: 'Linux', price: 0 }]
+        });
+      } finally {
+        setLoading(false);
+      }
+    };
+    
+    fetchComponents();
+  }, [selectedCpu, selectedMemory, selectedStorage, selectedLocation, selectedOS]);
   
   // Toggle section expansion
   const toggleSection = (section) => {
     setExpandedSections(prev => ({
       ...prev,
       [section]: !prev[section]
     }));
   };
   
   // Calculate total price
   const totalPrice = useMemo(() => {
     let total = 0;
     if (selectedCpu) total += selectedCpu.price;
     if (selectedMemory) total += selectedMemory.price;
     if (selectedStorage) total += selectedStorage.price;
     if (selectedOS) total += selectedOS.price;
     return total;
   }, [selectedCpu, selectedMemory, selectedStorage, selectedOS]);
   
   // Check if all required components are selected
   const isConfigurationComplete = useMemo(() => {
     return selectedCpu && selectedMemory && selectedStorage && selectedLocation && selectedOS;
   }, [selectedCpu, selectedMemory, selectedStorage, selectedLocation, selectedOS]);
   
   // Update parent component with configuration
   useEffect(() => {
     if (isConfigurationComplete) {
       setConfiguration({
         cpu: selectedCpu,
         memory: selectedMemory,
         storage: selectedStorage,
         location: selectedLocation,
         os: selectedOS,
         totalPrice
       });
     }
   }, [isConfigurationComplete, selectedCpu, selectedMemory, selectedStorage, selectedLocation, selectedOS, totalPrice, setConfiguration]);
   
   const handleContinue = () => {
     if (isConfigurationComplete) {
       onNext();
     }
   };
   
+  if (loading) {
+    return (
+      <div className="max-w-4xl mx-auto">
+        <h2 className="text-2xl font-bold mb-6">Configure Your Server</h2>
+        <div className="space-y-6">
+          {['cpu', 'memory', 'storage', 'location', 'os'].map((section) => (
+            <div key={section} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
+              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
+              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
+                {[1, 2, 3].map((i) => (
+                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
+                ))}
+              </div>
+            </div>
+          ))}
+        </div>
+      </div>
+    );
+  }
+  
+  if (error) {
+    return (
+      <div className="max-w-4xl mx-auto">
+        <h2 className="text-2xl font-bold mb-6">Configure Your Server</h2>
+        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
+          <p className="font-medium">{error}</p>
+          <p className="mt-2">Please try refreshing the page or contact support if the problem persists.</p>
+        </div>
+      </div>
+    );
+  }
+  
   return (
     <div className="max-w-4xl mx-auto">
       <h2 className="text-2xl font-bold mb-6">Configure Your Server</h2>
@@ .. @@
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-              {components.cpu.map((cpu) => (
+              {components?.cpu?.map((cpu) => (
                 <ComponentCard
                   key={cpu.id}
                   title={cpu.name}
@@ .. @@
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-              {components.memory.map((memory) => (
+              {components?.memory?.map((memory) => (
                 <ComponentCard
                   key={memory.id}
                   title={memory.name}
@@ .. @@
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-              {components.storage.map((storage) => (
+              {components?.storage?.map((storage) => (
                 <ComponentCard
                   key={storage.id}
                   title={storage.name}
@@ .. @@
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-              {components.location.map((location) => (
+              {components?.location?.map((location) => (
                 <ComponentCard
                   key={location.id}
                   title={location.name}
@@ .. @@
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-              {components.os.map((os) => (
+              {components?.operatingSystems?.map((os) => (
                 <ComponentCard
                   key={os.id}
                   title={os.name}
@@ .. @@
           <button
             onClick={handleContinue}
             disabled={!isConfigurationComplete}
-            className={`w-full py-4 px-4 rounded-lg font-medium transition-all duration-200 ${
+            className={`w-full py-4 px-4 rounded-lg font-medium transition-all duration-200 flex justify-center items-center ${
               isConfigurationComplete
                 ? "bg-blue-600 hover:bg-blue-700 text-white" 
                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
             }`}
           >
-            Continue to Registration
+            {loading ? (
+              <>
+                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
+                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
+                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
+                </svg>
+                Loading...
+              </>
+            ) : (
+              'Continue to Registration'
+            )}
           </button>
         </div>
       </div>
     </div>
   );
 }