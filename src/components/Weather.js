import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';

class Weather extends Component {
    state = { temp: this.props.temp };

    renderTemp() {
        const { isFahrenheit } = this.props;
        let temp = this.state.temp;

        if (temp) {
            // Converting celsius (default scale) to fahrenheit
            if (isFahrenheit) temp = (temp * 1.8) + 32;
            return `${Math.floor(temp)}°`;
        } else {
            return '...';
        }
    }

    render() {
        return (
            <View>
                <Text style={this.props.style}>
                    {this.renderTemp()}
                </Text>
            </View>
        );
    }
}

export default Weather;