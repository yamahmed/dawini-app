import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, TextInput, StyleSheet ,List} from 'react-native';
import { Card } from 'react-native-paper';
import * as Location from 'expo-location';
import Header from './Header';
import { COLORS, SIZES, FONTS } from '../../constants1';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nurses, setNurses] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [maxDistance, setMaxDistance] = useState(''); // Added state for maximum distance
  useEffect(() => {
    // Fetch the initial location
    fetchLocation();

    // Subscribe to location updates
    const locationSubscription = Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 }, (newLocation) => {
      setLocation(newLocation);
    });
  
    return () => {
      // Clean up location subscription
      if (locationSubscription) {
        // locationSubscription.remove();
      }
    };
  }, []);
  useEffect(() => { 
    fetchLocation();
    fetchNurses();
  }, []);

  useEffect(() => {
    searchFilterFunction(search);
  }, [search]);

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/nurses');
      if (!response.ok) {
        throw new Error('Failed to fetch nurses');
      }
      const data = await response.json();
      setNurses(data);
      setFilteredDataSource(data); // Initialize filtered data source
    } catch (error) {
      console.error('Error fetching nurses:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFilterFunction = (text) => {
    const newData = nurses.filter((item) => {
      const fullName = item.fullName ? item.fullName.toUpperCase() : '';
      const searchText = text.toUpperCase();
      return fullName.includes(searchText); // Use includes() for simple string matching
    });
    setFilteredDataSource(newData);
    setSearch(text);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance; // distance in meters
  };

  const filterByLocation = (threshold) => {
    if (!location) return nurses;

    return nurses.filter((nurse) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        nurse.latitude,
        nurse.longitude
      );
      return distance <= threshold;
    });
  };

  const handleSearchByDistance = () => {
    if (!maxDistance || isNaN(maxDistance)) return;
    const threshold = parseInt(maxDistance);
    const filteredNurses = filterByLocation(threshold);
    setFilteredDataSource(filteredNurses);
  };


  const handleChatNavigation = () => {
    navigation.navigate('Chat');
  };
  const renderNurseItem = ({ item }) => (
<TouchableOpacity onPress={() => {
  if (item && typeof item === 'object' && 'idCare taker' in item) {
    navigation.navigate("ProfileView", { 
      'idCare taker': item['idCare taker'], 
      message: 'Hello from HomeScreen!'
    })
  } else {
    console.error('Error: item is undefined or idCare taker property is not present:', item);
  }
}}>
    <Card style={{ ...styles.cardContainer, padding: 10, width: "99%", marginLeft: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://i.ibb.co/cgrKXWk/beautiful-young-female-doctor-looking-camera-office-1301-7807.jpg" }}
            style={styles.image}
          />
        </View>
        <View style={{ padding: SIZES.padding }}>
          <Text style={{ fontSize: 14, color: COLORS.black, fontWeight: "bold" }}>
            {item.fullName}
          </Text>

          <Text style={{ fontSize: 12, marginVertical: 4 }}>{item.working_Area}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
  );

  return (
  <>
      <View>
        <Header />
      </View>
      <View style={{ marginBottom: 12 }}>
        {/* <Text style={{ ...FONTS.h3, marginVertical: SIZES.padding * 2 }}>Closest Nurses</Text> */}
        {location && (
          <View>
            {/* <Text>Timestamp: {location.timestamp}</Text>
            <Text>Mocked: {location.mocked ? 'Yes' : 'No'}</Text> */}
            <Text>
              Latitude: {location.coords.latitude}, Longitude: {location.coords.longitude}
            </Text>
          </View>
        )}
         {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
      <TouchableOpacity onPress={handleChatNavigation}>
        <Text>Go to Chat Screen</Text>
      </TouchableOpacity>
    </View> */}
     
     
      
      </View>
      <View style={{ marginBottom: 15, padding: 5 }}>
        <Text style={{ ...FONTS.h3, marginVertical: SIZES.padding * 2 }}>All Nurses</Text>
        <View style={{ marginLeft: 1 }}>
          <TextInput
            style={styles.textInputStyle}
            onChangeText={(text) => setSearch(text)}
            value={search}
            placeholder="Search Nurses"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.textInputStyle, { flex: 1 }]}
              onChangeText={(text) => setMaxDistance(text)}
              value={maxDistance}
              placeholder="Max Distance (meters)"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchByDistance}>
              <Text style={{ color: 'white' }}>Search</Text>
            </TouchableOpacity>
          </View>
          <FlatList
  ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
  data={filteredDataSource}
  keyExtractor={(item) => item['idCare taker'].toString()}
  renderItem={renderNurseItem}
/>
        </View>
      </View>
     
      </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    width: '99%',
    marginLeft: 2,
  },
  imageContainer: {
    borderRadius: 8, // Adjust border radius as needed
    overflow: 'hidden', // Clip the image to the border radius
  },
  image: {
    height: 70,
    width: 70,
  },
  container: {
    backgroundColor: 'white',
  },
  itemStyle: {
    padding: 10,
  },
  textInputStyle: {
    height: 40,
    borderWidth: 1,
    paddingLeft: 20,
    margin: 5,
    borderColor: '#009688',
    backgroundColor: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#009688',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
});
