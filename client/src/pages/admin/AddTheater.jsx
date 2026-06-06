import React, { useState, useRef, useCallback, useEffect } from 'react'
import Title from '../../components/admin/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { MapPin, Building, Navigation, Utensils, Search, Edit3, Trash2, Plus, X } from 'lucide-react'
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};
const defaultCenter = {
  lat: 19.0760, // Default Mumbai
  lng: 72.8777
};

const AddTheater = () => {
  const { axios, getToken } = useAppContext()
  
  // Google Maps Loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, 
    libraries: libraries
  });

  const [map, setMap] = useState(null)
  const [markerPos, setMarkerPos] = useState(defaultCenter)
  const autocompleteRef = useRef(null)

  // --- NEW: Management State ---
  const [theaters, setTheaters] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  const [formData, setFormData] = useState({
    _id: '', name: '', city: '', address: '', pincode: '', 
    lat: '', long: '', facilities: ''
  })

  // --- Fetch Existing Theaters ---
  const fetchTheaters = async () => {
      try {
          const { data } = await axios.get('/api/admin/all-theaters', {
              headers: { Authorization: `Bearer ${await getToken()}` }
          });
          if(data.success) setTheaters(data.theaters);
      } catch (error) { 
          console.error(error); 
          toast.error("Failed to load theaters");
      } finally {
          setLoadingList(false);
      }
  }

  useEffect(() => {
      fetchTheaters();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  // --- GOOGLE MAPS HANDLERS ---
  const onLoad = useCallback(function callback(map) { setMap(map) }, [])
  const onUnmount = useCallback(function callback(map) { setMap(null) }, [])

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        let city = "";
        let pincode = "";
        
        place.address_components?.forEach(component => {
            if (component.types.includes("locality")) city = component.long_name;
            if (component.types.includes("postal_code")) pincode = component.long_name;
        });

        setFormData(prev => ({
            ...prev,
            name: place.name || prev.name,
            address: place.formatted_address || prev.address,
            city: city || prev.city,
            pincode: pincode || prev.pincode,
            lat: lat,
            long: lng
        }));

        setMarkerPos({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(15);
        toast.success("Location mapped!");
    }
  }

  const onMarkerDragEnd = (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setFormData(prev => ({ ...prev, lat: newLat, long: newLng }));
      setMarkerPos({ lat: newLat, lng: newLng });
  }

  // --- MANAGEMENT ACTIONS ---
  const handleEditClick = (theater) => {
      const lat = theater.location.coordinates[1];
      const lng = theater.location.coordinates[0];

      setFormData({
          _id: theater._id,
          name: theater.name,
          city: theater.city,
          address: theater.address,
          pincode: theater.pincode || '',
          lat: lat,
          long: lng,
          facilities: theater.facilities ? theater.facilities.join(', ') : ''
      });
      
      setIsEditMode(true);
      setMarkerPos({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(16);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Editing: ${theater.name}`);
  }

  const handleDelete = async (id) => {
      if(!window.confirm("Are you sure? This will delete the theater and ALL shows scheduled there.")) return;
      try {
          const { data } = await axios.post('/api/admin/delete-theater', { id }, {
              headers: { Authorization: `Bearer ${await getToken()}` }
          });
          if(data.success) {
              toast.success("Theater Deleted");
              if(formData._id === id) resetForm();
              fetchTheaters();
          } else {
              toast.error(data.message);
          }
      } catch (error) { toast.error("Delete failed"); }
  }

  const resetForm = () => {
      setFormData({ _id: '', name: '', city: '', address: '', pincode: '', lat: '', long: '', facilities: '' });
      setIsEditMode(false);
      setMarkerPos(defaultCenter);
      map?.panTo(defaultCenter);
      map?.setZoom(12);
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const endpoint = isEditMode ? '/api/admin/update-theater' : '/api/admin/add-theater';
      const { data } = await axios.post(endpoint, formData, {
         headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        toast.success(isEditMode ? "Theater Updated Successfully!" : "Theater Added Successfully!")
        resetForm()
        fetchTheaters()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Operation failed")
    }
  }

  const filteredTheaters = theaters.filter(theater => 
      theater.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      theater.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theater.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='max-w-6xl mx-auto pb-20'>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
          <Title text1={isEditMode ? "Edit" : "Add"} text2="Theater" />
          {isEditMode && (
              <button onClick={resetForm} className="text-xs bg-red-500/10 text-red-500 px-4 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 hover:bg-red-500 hover:text-white transition">
                  <X size={14}/> Cancel Edit
              </button>
          )}
      </div>
      
      {/* FORM & MAP CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* --- GOOGLE MAP SECTION --- */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 h-fit sticky top-6">
              <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 mb-2 block uppercase flex items-center gap-2">
                      <Search size={14} className="text-primary"/> Search Google Maps
                  </label>
                  {isLoaded ? (
                      <Autocomplete 
                          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)} 
                          onPlaceChanged={onPlaceChanged}
                          options={{ componentRestrictions: { country: "in" } }}
                      >
                          <input 
                              type="text"
                              placeholder="Search for a theater..."
                              className="w-full p-3.5 bg-gray-900 border border-gray-600 rounded-xl text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-lg text-sm"
                          />
                      </Autocomplete>
                  ) : (
                      <div className="h-12 bg-gray-900 rounded-xl animate-pulse"></div>
                  )}
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-600 relative shadow-xl">
                  {isLoaded ? (
                      <GoogleMap mapContainerStyle={mapContainerStyle} center={markerPos} zoom={12} onLoad={onLoad} onUnmount={onUnmount}
                          options={{
                              disableDefaultUI: false, streetViewControl: false, mapTypeControl: false,
                              styles: [
                                  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                                  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                              ]
                          }}
                      >
                          <Marker position={markerPos} draggable={true} onDragEnd={onMarkerDragEnd} />
                      </GoogleMap>
                  ) : (
                      <div className="h-[300px] bg-gray-900 flex items-center justify-center text-gray-500">Loading Google Maps...</div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-[10px] text-gray-300 font-medium">
                      Drag marker to adjust location
                  </div>
              </div>
          </div>

          {/* --- FORM SECTION --- */}
          <form onSubmit={handleSubmit} className={`space-y-6 bg-gray-800/40 p-8 rounded-2xl border transition-all ${isEditMode ? 'border-primary/50 shadow-[0_0_20px_rgba(248,69,101,0.1)]' : 'border-gray-700'}`}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
               <div>
                 <label className='text-xs font-bold text-gray-400 mb-2 block uppercase'>Theater Name</label>
                 <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg px-3 focus-within:border-primary transition">
                    <Building size={18} className="text-gray-500 mr-2"/>
                    <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. PVR Icon" className="w-full p-3 bg-transparent text-white outline-none" />
                 </div>
               </div>
               <div>
                 <label className='text-xs font-bold text-gray-400 mb-2 block uppercase'>City</label>
                 <input required name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary transition" />
               </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className="md:col-span-2">
                    <label className='text-xs font-bold text-gray-400 mb-2 block uppercase'>Address</label>
                    <input required name="address" value={formData.address} onChange={handleChange} placeholder="Street Name, Area" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-400 mb-2 block uppercase'>Pincode</label>
                    <input required name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                </div>
            </div>

            <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700/50">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <Navigation size={16} className="text-primary"/> Geolocation Data
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <label className='text-xs font-bold text-gray-500 mb-1 block uppercase'>Latitude</label>
                        <input type="number" step="any" required name="lat" value={formData.lat} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary font-mono text-sm" />
                    </div>
                    <div>
                        <label className='text-xs font-bold text-gray-500 mb-1 block uppercase'>Longitude</label>
                        <input type="number" step="any" required name="long" value={formData.long} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary font-mono text-sm" />
                    </div>
                </div>
            </div>

            <div>
                <label className='text-xs font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase'><Utensils size={14}/> Facilities (Comma separated)</label>
                <input name="facilities" value={formData.facilities} onChange={handleChange} placeholder="Dolby Atmos, Recliners, Food Court" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
            </div>

            <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isEditMode ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-primary hover:bg-red-600 shadow-primary/20'}`}>
                {isEditMode ? <><Edit3 size={18}/> Update Theater Details</> : <><Plus size={18}/> Add New Theater</>}
            </button>
          </form>
      </div>

      {/* --- EXISTING THEATERS LIST --- */}
      <div className="border-t border-gray-800 pt-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Building className="text-blue-500"/> Manage Theaters
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">View, edit, or remove locations from your database.</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search theaters..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                  </div>
                  <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-gray-700 whitespace-nowrap">
                      Total: {filteredTheaters.length}
                  </span>
              </div>
          </div>

          {loadingList ? (
              <div className="text-center py-10 text-gray-500">Loading theaters...</div>
          ) : filteredTheaters.length === 0 ? (
              <div className="bg-gray-800/30 border border-gray-700 border-dashed rounded-xl p-10 text-center text-gray-500">
                  {searchTerm ? "No theaters found matching your search." : "No theaters added yet. Use the form above to add your first location."}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredTheaters.map((theater) => (
                      <div key={theater._id} className="bg-[#121212] border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors group relative flex flex-col justify-between">
                          
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                  <h3 className="text-lg font-bold text-white leading-tight pr-4">{theater.name}</h3>
                                  <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">{theater.city}</span>
                              </div>
                              
                              <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-4 line-clamp-2">
                                  <MapPin size={14} className="text-primary shrink-0 mt-0.5"/> 
                                  {theater.address} {theater.pincode && `- ${theater.pincode}`}
                              </p>

                              <div className="flex flex-wrap gap-1.5 mb-6">
                                  {theater.facilities?.slice(0, 3).map((f, i) => (
                                      <span key={i} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">{f}</span>
                                  ))}
                                  {theater.facilities?.length > 3 && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">+{theater.facilities.length - 3}</span>}
                              </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4 border-t border-gray-800/50">
                              <button onClick={() => handleEditClick(theater)} className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                                  <Edit3 size={14}/> Edit
                              </button>
                              <button onClick={() => handleDelete(theater._id)} className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                                  <Trash2 size={14}/> Delete
                              </button>
                          </div>

                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  )
}
export default AddTheater