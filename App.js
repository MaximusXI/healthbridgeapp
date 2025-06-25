import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, ScrollView } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';

const App = () => {
  const [status, setStatus] = useState('Idle');
  const [healthData, setHealthData] = useState({});

  const RECORD_TYPES = [
    'ActiveCaloriesBurned',
    'Steps',
    'HeartRate',
    'BloodPressure',
    'SleepSession',
    'Weight',
    'Height',
    'BodyTemperature',
    'OxygenSaturation',
    'BasalBodyTemperature',
    'ExerciseSession',
    'RespiratoryRate',
    'Vo2Max',
    'BodyFat',
    'BloodGlucose'
  ];

  const requestHealthPermissions = async () => {
    try {
      setStatus('Initializing...');
      const isInitialized = await initialize();

      if (!isInitialized) {
        setStatus('Health Connect not supported or not installed.');
        return;
      }

      const permissionList = RECORD_TYPES.map((type) => ({
        accessType: 'read',
        recordType: type,
      }));

      setStatus('Requesting permissions...');
      const granted = await requestPermission(permissionList);
      console.log('Granted permissions:', granted);

      setStatus('Permissions granted ✅');
    } catch (error) {
      console.error(error);
      setStatus('Error requesting permissions ❌');
    }
  };

  const fetchHealthData = async () => {
    try {
      setStatus('Fetching data...');
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const fetchedData = {};

      for (const recordType of RECORD_TYPES) {
        try {
          const response = await readRecords(recordType, {
            timeRangeFilter: {
              operator: 'between',
              startTime: oneDayAgo.toISOString(),
              endTime: now.toISOString(),
            },
          });

          if (response.records.length > 0) {
            fetchedData[recordType] = response.records;
            console.log(response.records)
          }
        } catch (err) {
          console.warn(`Failed to read ${recordType}:`, err.message);
        }
      }

      setHealthData(fetchedData);
      setStatus('Data fetched ✅');
    } catch (error) {
      console.error(error);
      setStatus('Error fetching data ❌');
    }
  };

  const renderRecordValue = (recordType, record) => {
    switch (recordType) {
      case 'ActiveCaloriesBurned':
        return `kcal: ${record.energy?.inKilocalories}`;
      case 'Steps':
        return `Steps: ${record.count}`;
      case 'HeartRate':
        return `BPM: ${record.beatsPerMinute}`;
      case 'BloodPressure':
        return `Systolic: ${record.systolic?.inMillimetersOfMercury} mmHg, Diastolic: ${record.diastolic?.inMillimetersOfMercury} mmHg`;
      case 'SleepSession':
        return `Duration: ${record.startTime} to ${record.endTime}`;
      case 'Weight':
        return `Weight: ${record.weight?.inKilograms} kg`;
      case 'Height':
        return `Height: ${record.height?.inMeters} m`;
      case 'BodyTemperature':
      case 'BasalBodyTemperature':
        return `Temp: ${record.temperature?.inCelsius} °C`;
      case 'OxygenSaturation':
        return `SpO₂: ${record.percentage}%`;
      case 'RespiratoryRate':
        return `Breaths/min: ${record.rate}`;
      case 'Vo2Max':
        return `VO₂ Max: ${record.vo2MillilitersPerMinuteKilogram}`;
      case 'BodyFat':
        return `Body Fat %: ${record.percentage}`;
      case 'ExerciseSession':
        return `Exercise: ${record.exerciseType} | Duration: ${record.startTime} to ${record.endTime}`;
      case 'BloodGlucose':
        return `BloodGlucose: ${record.level?.inMillimolesPerLiter}`;
      default:
        return `Data available`;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Health Connect: All Metrics</Text>
      <Button title="Request Permissions" onPress={requestHealthPermissions} />
      <View style={{ height: 10 }} />
      <Button title="Fetch Health Data" onPress={fetchHealthData} />
      <Text style={styles.status}>Status: {status}</Text>

      {Object.keys(healthData).map((recordType) => (
        <View key={recordType} style={styles.recordSection}>
          <Text style={styles.sectionTitle}>{recordType}</Text>
          {healthData[recordType].map((record, index) => (
            <Text key={index} style={styles.record}>
              ➤ {record.startTime} — {record.endTime || ''} | {renderRecordValue(recordType, record)}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  status: { marginTop: 20, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { marginTop: 25, fontSize: 18, fontWeight: 'bold', color: '#ffead6' },
  recordSection: { marginBottom: 10 },
  record: { fontSize: 14, marginTop: 6 },
});

export default App;
