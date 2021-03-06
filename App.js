import React, { Component }  from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import SplashScreen from 'react-native-splash-screen';
import axios from 'axios';

import Weather from './src/components/Weather';
import WeatherList from './src/components/WeatherList';

// Error code constant
const ERROR_CODE = {
	PERMISSION_ERROR: 1,
	REQUEST_ERROR: 2
};

export default class App extends Component {

	state = {
		location: {}, // Information about user's current location (city, woeid)
		consolidated_weather: [], // Daily forecast information
		isFahrenheit: false,
		errorMessage: false,
		coords: { // Default map information
			latitude: 37.78825,
			longitude: -122.4324,
			latitudeDelta: 0.0022,
			longitudeDelta: 0.0022
		} 
	};

	componentDidMount() {
		navigator.geolocation.getCurrentPosition(this.currentPositionSuccess.bind(this), this.currentPositionFailure.bind(this));
		SplashScreen.hide();
	}
	
	currentPositionSuccess(position) {
		const { coords } = position;
		
		// Checking if coords have the requiring keys
		if (coords && coords.latitude && coords.longitude) {
			// Set delta to zoom in to de map
			coords.latitudeDelta = 0.0022;
			coords.longitudeDelta = 0.0022;

			this.setState({ coords });
			// Get the location ID of current user's latitude and longitude 
			this.getWorldID(coords.latitude, coords.longitude);
		}
	}

	currentPositionFailure() {
		this.onLocationError(ERROR_CODE.PERMISSION_ERROR);
	}

	getWorldID(lat, lon) {
		axios.get(`https://www.metaweather.com/api/location/search/?lattlong=${lat},${lon}`)
		.then((res) => {
			if (res && res.data) {
				const { data } = res;
				
				// Check if have the requiring keys
				if (data && data.length) {
					// Get the first location of array (major proximity)
					this.setState({ location: data[0] });
					// Request for daily forecast
					this.getWeather();
				}
			}
		})
		.catch((err) => {
			this.onLocationError(ERROR_CODE.REQUEST_ERROR);
		});
	}

	getWeather() {
		const { location } = this.state;

		if (location && location.woeid) {
			axios.get(`https://www.metaweather.com/api/location/${location.woeid}/`)
			.then((res) => {
				if (res && res.data) {
					const { data } = res;
					
					// Check if data have weather information
					if (data && data.consolidated_weather && data.consolidated_weather.length) {
						const { consolidated_weather } = data;
						this.setState({ consolidated_weather });
					}
				}
			})
			.catch((err) => {
				this.onLocationError(ERROR_CODE.REQUEST_ERROR);
			});
		}		
	}

	onLocationError(err) {
		let errorMessage = 'Não foi possível encontrar o local. ';

		switch (err) {
			case ERROR_CODE.PERMISSION_ERROR:
				errorMessage += 'Verifique as permissões do aplicativo.';
				break;
			case ERROR_CODE.REQUEST_ERROR:
				errorMessage += 'Verifique sua conexão com a internet.';
				break;
			default: // Unknown Error
				errorMessage = 'Não foi possível mostrar as informações de clima. Tente novamente mais tarde.'
				break;
		}

		this.setState({ errorMessage });
	}

	toggleSwitch() {
		this.setState({ isFahrenheit: !this.state.isFahrenheit });
	}

	renderLocationName() {
		const { location, errorMessage } = this.state;
		if (!errorMessage) return location && location.title ? location.title : 'Carregando...';
	}

	renderCurrentWeather() {
		const { consolidated_weather, isFahrenheit } = this.state;

		if (consolidated_weather && consolidated_weather.length) {
			return (
				<Weather style={styles.locationTemp} temp={consolidated_weather[0].the_temp} isFahrenheit={isFahrenheit} />
			);
		}
	}

	renderWeatherList() {
		const { consolidated_weather, isFahrenheit } = this.state;

		if (consolidated_weather && consolidated_weather.length) {
			return (
				<WeatherList weather={consolidated_weather} isFahrenheit={isFahrenheit} />
			);
		}
	}

	renderErrorMessage() {
		const { errorMessage } = this.state;

		if (errorMessage) {
			return (
				<Text style={styles.errorMessage}>
					{errorMessage}
				</Text>
			);
		}
	}

	render() {
		const { consolidated_weather, isFahrenheit } = this.state;

		return (
			<View style={styles.body}>
				<View style={styles.locationContainer}>
					{this.renderErrorMessage()}
					<Text style={styles.locationName}>
						{this.renderLocationName()}
					</Text>
					{this.renderCurrentWeather()}
				</View>
				<View style={styles.mapContainer}>
					<MapView
						region={this.state.coords}
						style={styles.map}
					>
						<Marker coordinate={this.state.coords} pinColor="#ff5a00" />
					</MapView>
				</View>
				<View style={styles.weatherContainer}>
					{this.renderWeatherList()}
				</View>
				<TouchableOpacity onPress={this.toggleSwitch.bind(this)}>
					<View style={styles.switchContainer}>
						<Text style={styles.scaleText}>
							Celsius / Fahrenheit
						</Text>
						<Switch
							onValueChange={this.toggleSwitch.bind(this)}
							value={isFahrenheit}
							trackColor={{ true: "#ffae82", false: null }}
							thumbTintColor="#ff5a00"
						/>
					</View>
				</TouchableOpacity>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: { 
		flex: 1, 
		padding: 16,
		backgroundColor: '#FFF'
	},
	locationName: {
		fontSize: 26,
		textAlign: 'center',
		fontWeight: '500',
		color: '#ff5a00'
	},
	locationTemp: {
		fontSize: 22,
		textAlign: 'center',
		color: '#436389'
	},
	locationContainer: {
		minHeight: 100
	},
	mapContainer: {
		flex: 0.7,
		overflow: 'hidden',
		backgroundColor: '#FFF'
	},
	map: { 
		...StyleSheet.absoluteFillObject 
	},
	weatherContainer: {
		flex: 1,
		marginTop: 16
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	scaleText: {
		fontSize: 16,
		color: '#436389'
	},
	errorMessage: {
		fontSize: 14,
		color: '#AAA'
	}
});
