'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');
const util = require('../../node_modules/homey-zwavedriver/lib/util');

class ZMDimmerDevice extends ZwaveDevice
{
  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit() 
  {
    // enable debugging
    //this.enableDebug();

    //this.printNode();

    this.buttonMap = 
    {
      1: {
        button: 'External switch 1',
      },
      2: {
        button: 'External switch 2',
      }
    };

    this.sceneMap = 
    {
      'Key Pressed 1 time': {
        scene: 'Key Pressed 1 time',
      },
      'Key Released': {
        scene: 'Key Released',
      },
      'Key Held Down': {
        scene: 'Key Held Down',
      },
      'Key Pressed 2 times': {
        scene: 'Key Pressed 2 times',
      },
      'Key Pressed 3 times': {
        scene: 'Key Pressed 3 times',
      },
      'Key Pressed 4 times': {
        scene: 'Key Pressed 4 times',
      },
      'Key Pressed 5 times': {
        scene: 'Key Pressed 5 times',
      }
    };

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
      set: 'SWITCH_MULTILEVEL_SET',
      setParserV4(value, options) {
        return {
          Value: (value) ? 'on/enable' : 'off/disable',
          'Dimming Duration': 'Default',
        };
      }
    });

    this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
      setParserV4(value, options) {
        const duration = (options.hasOwnProperty('duration') ? new Buffer([util.calculateDimDuration(options.duration)]) : 'Default');
        if (this.hasCapability('onoff')) this.setCapabilityValue('onoff', value > 0).catch(this.error);
        return {
          Value: Math.round(value * 99),
          'Dimming Duration': duration,
        };
      }
    });

    // register a report listener (SDK2 style not yet operational)
    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
      this.log('registerReportListener', rawReport, parsedReport);
      if (rawReport.hasOwnProperty('Properties1')
				&& rawReport.Properties1.hasOwnProperty('Key Attributes')
				&& rawReport.hasOwnProperty('Scene Number')
				&& rawReport.hasOwnProperty('Sequence Number')) {
        const remoteValue = {
          button: this.buttonMap[rawReport['Scene Number'].toString()].button,
          scene: rawReport.Properties1['Key Attributes'],
        };

        this.log('Triggering sequence:', rawReport['Sequence Number'], 'remoteValue', remoteValue);

        // Trigger the trigger card with 2 autocomplete options
        this.homey.app.triggerZPushButton_scene.trigger(this, null, remoteValue);
        
        // Trigger the trigger card with tokens
        this.homey.app.triggerZPushButton_button.trigger(this, remoteValue, null);
      }
    });

    // Listen for reset_meter maintenance action
    this.registerCapabilityListener('button.reset_meter', async () => {
      let commandClassMeter = null;
      commandClassMeter = this.getCommandClass('METER');
      if (commandClassMeter && commandClassMeter.hasOwnProperty('METER_RESET')) {
        const result = await commandClassMeter.METER_RESET({});
        if (result !== 'TRANSMIT_COMPLETE_OK') throw result;
      }
      else {
        throw new Error('Reset meter not supported');
      }
    });
    
    if (this.hasCapability('meter_power')) this.registerCapability('meter_power', 'METER');
    if (this.hasCapability('measure_power')) this.registerCapability('measure_power', 'METER');

    this.log('ZM-Dimmer has been initialized');

    this.setAvailable().catch(this.error); 
  }
  
  onSceneAutocomplete(query, args) {
    let resultArray = [];
    for (const sceneID in this.sceneMap) {
      resultArray.push({
        id: this.sceneMap[sceneID].scene,
        name: this.homey.__(this.sceneMap[sceneID].scene),
      });
    }
    this.log(resultArray);
    // filter for query
    resultArray = resultArray.filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
    this.log(resultArray);
    return Promise.resolve(resultArray);
  }

  onButtonAutocomplete(query, args) {
    let resultArray = [];
    for (const sceneID in this.buttonMap) {
      resultArray.push({
        id: this.buttonMap[sceneID].button,
        name: this.homey.__(this.buttonMap[sceneID].button),
      });
    }
    this.log(resultArray);
    // filter for query
    resultArray = resultArray.filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
    this.log(resultArray);
    return Promise.resolve(resultArray);
  }
}

module.exports = ZMDimmerDevice;


/*
 ------------------------------------------
 - Manufacturer id: 411
 - ProductType id: 2
 - Product id: 8705
 - Firmware Version: 1.20
 - Hardware Version: 1
 - Firmware id: 8705
 - Secure: тип
 - Battery: false
 - DeviceClassBasic: BASIC_TYPE_ROUTING_SLAVE
 - DeviceClassGeneric: GENERIC_TYPE_SWITCH_MULTILEVEL
 - DeviceClassSpecific: SPECIFIC_TYPE_NOT_USED
 - Token: a9b1444e-dc20-4c2d-a73a-a10334e34ead
 - CommandClass: COMMAND_CLASS_ZWAVEPLUS_INFO
 -- Version: 2
 -- Commands:
 --- ZWAVEPLUS_INFO_GET
 --- ZWAVEPLUS_INFO_REPORT
 - CommandClass: COMMAND_CLASS_TRANSPORT_SERVICE
 -- Version: 2
 -- Commands:
 --- COMMAND_FIRST_SEGMENT
 --- COMMAND_SEGMENT_COMPLETE
 --- COMMAND_SEGMENT_REQUEST
 --- COMMAND_SEGMENT_WAIT
 --- COMMAND_SUBSEQUENT_SEGMENT
 - CommandClass: COMMAND_CLASS_SECURITY
 -- Version: 1
 -- Commands:
 --- NETWORK_KEY_SET
 --- NETWORK_KEY_VERIFY
 --- SECURITY_COMMANDS_SUPPORTED_GET
 --- SECURITY_COMMANDS_SUPPORTED_REPORT
 --- SECURITY_MESSAGE_ENCAPSULATION
 --- SECURITY_MESSAGE_ENCAPSULATION_NONCE_GET
 --- SECURITY_NONCE_GET
 --- SECURITY_NONCE_REPORT
 --- SECURITY_SCHEME_GET
 --- SECURITY_SCHEME_INHERIT
 --- SECURITY_SCHEME_REPORT
 - CommandClass: COMMAND_CLASS_SECURITY_2
 -- Version: 1
 -- Commands:
 --- SECURITY_2_NONCE_GET
 --- SECURITY_2_NONCE_REPORT
 --- SECURITY_2_MESSAGE_ENCAPSULATION
 --- KEX_GET
 --- KEX_REPORT
 --- KEX_SET
 --- KEX_FAIL
 --- PUBLIC_KEY_REPORT
 --- SECURITY_2_NETWORK_KEY_GET
 --- SECURITY_2_NETWORK_KEY_REPORT
 --- SECURITY_2_NETWORK_KEY_VERIFY
 --- SECURITY_2_TRANSFER_END
 --- SECURITY_2_COMMANDS_SUPPORTED_GET
 --- SECURITY_2_COMMANDS_SUPPORTED_REPORT
 --- SECURITY_2_CAPABILITIES_GET
 --- SECURITY_2_CAPABILITIES_REPORT
 - CommandClass: COMMAND_CLASS_SUPERVISION
 -- Version: 1
 -- Commands:
 --- SUPERVISION_GET
 --- SUPERVISION_REPORT
 - CommandClass: COMMAND_CLASS_SWITCH_MULTILEVEL
 -- Version: 4
 -- Commands:
 --- SWITCH_MULTILEVEL_GET
 --- SWITCH_MULTILEVEL_REPORT
 --- SWITCH_MULTILEVEL_SET
 --- SWITCH_MULTILEVEL_START_LEVEL_CHANGE
 --- SWITCH_MULTILEVEL_STOP_LEVEL_CHANGE
 --- SWITCH_MULTILEVEL_SUPPORTED_GET
 --- SWITCH_MULTILEVEL_SUPPORTED_REPORT
 - CommandClass: COMMAND_CLASS_CONFIGURATION
 -- Version: 4
 -- Commands:
 --- CONFIGURATION_BULK_GET
 --- CONFIGURATION_BULK_REPORT
 --- CONFIGURATION_BULK_SET
 --- CONFIGURATION_GET
 --- CONFIGURATION_REPORT
 --- CONFIGURATION_SET
 --- CONFIGURATION_NAME_GET
 --- CONFIGURATION_NAME_REPORT
 --- CONFIGURATION_INFO_GET
 --- CONFIGURATION_INFO_REPORT
 --- CONFIGURATION_PROPERTIES_GET
 --- CONFIGURATION_PROPERTIES_REPORT
 --- CONFIGURATION_DEFAULT_RESET
 - CommandClass: COMMAND_CLASS_ASSOCIATION
 -- Version: 2
 -- Commands:
 --- ASSOCIATION_GET
 --- ASSOCIATION_GROUPINGS_GET
 --- ASSOCIATION_GROUPINGS_REPORT
 --- ASSOCIATION_REMOVE
 --- ASSOCIATION_REPORT
 --- ASSOCIATION_SET
 --- ASSOCIATION_SPECIFIC_GROUP_GET
 --- ASSOCIATION_SPECIFIC_GROUP_REPORT
 - CommandClass: COMMAND_CLASS_ASSOCIATION_GRP_INFO
 -- Version: 3
 -- Commands:
 --- ASSOCIATION_GROUP_NAME_GET
 --- ASSOCIATION_GROUP_NAME_REPORT
 --- ASSOCIATION_GROUP_INFO_GET
 --- ASSOCIATION_GROUP_INFO_REPORT
 --- ASSOCIATION_GROUP_COMMAND_LIST_GET
 --- ASSOCIATION_GROUP_COMMAND_LIST_REPORT
 - CommandClass: COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION
 -- Version: 3
 -- Commands:
 --- MULTI_CHANNEL_ASSOCIATION_GET
 --- MULTI_CHANNEL_ASSOCIATION_GROUPINGS_GET
 --- MULTI_CHANNEL_ASSOCIATION_GROUPINGS_REPORT
 --- MULTI_CHANNEL_ASSOCIATION_REMOVE
 --- MULTI_CHANNEL_ASSOCIATION_REPORT
 --- MULTI_CHANNEL_ASSOCIATION_SET
 - CommandClass: COMMAND_CLASS_VERSION
 -- Version: 3
 -- Commands:
 --- VERSION_COMMAND_CLASS_GET
 --- VERSION_COMMAND_CLASS_REPORT
 --- VERSION_GET
 --- VERSION_REPORT
 --- VERSION_CAPABILITIES_GET
 --- VERSION_CAPABILITIES_REPORT
 --- VERSION_ZWAVE_SOFTWARE_GET
 --- VERSION_ZWAVE_SOFTWARE_REPORT
 - CommandClass: COMMAND_CLASS_MANUFACTURER_SPECIFIC
 -- Version: 2
 -- Commands:
 --- MANUFACTURER_SPECIFIC_GET
 --- MANUFACTURER_SPECIFIC_REPORT
 --- DEVICE_SPECIFIC_GET
 --- DEVICE_SPECIFIC_REPORT
 - CommandClass: COMMAND_CLASS_DEVICE_RESET_LOCALLY
 -- Version: 1
 -- Commands:
 --- DEVICE_RESET_LOCALLY_NOTIFICATION
 - CommandClass: COMMAND_CLASS_POWERLEVEL
 -- Version: 1
 -- Commands:
 --- POWERLEVEL_GET
 --- POWERLEVEL_REPORT
 --- POWERLEVEL_SET
 --- POWERLEVEL_TEST_NODE_GET
 --- POWERLEVEL_TEST_NODE_REPORT
 --- POWERLEVEL_TEST_NODE_SET
 - CommandClass: COMMAND_CLASS_APPLICATION_STATUS
 -- Version: 1
 -- Commands:
 --- APPLICATION_BUSY
 --- APPLICATION_REJECTED_REQUEST
 - CommandClass: COMMAND_CLASS_FIRMWARE_UPDATE_MD
 -- Version: 5
 -- Commands:
 --- FIRMWARE_MD_GET
 --- FIRMWARE_MD_REPORT
 --- FIRMWARE_UPDATE_MD_GET
 --- FIRMWARE_UPDATE_MD_REPORT
 --- FIRMWARE_UPDATE_MD_REQUEST_GET
 --- FIRMWARE_UPDATE_MD_REQUEST_REPORT
 --- FIRMWARE_UPDATE_MD_STATUS_REPORT
 --- FIRMWARE_UPDATE_ACTIVATION_SET
 --- FIRMWARE_UPDATE_ACTIVATION_STATUS_REPORT
 --- FIRMWARE_UPDATE_MD_PREPARE_GET
 --- FIRMWARE_UPDATE_MD_PREPARE_REPORT
 - CommandClass: COMMAND_CLASS_INDICATOR
 -- Version: 3
 -- Commands:
 --- INDICATOR_GET
 --- INDICATOR_REPORT
 --- INDICATOR_SET
 - CommandClass: COMMAND_CLASS_METER
 -- Version: 3
 -- Commands:
 --- METER_GET
 --- METER_REPORT
 --- METER_RESET
 --- METER_SUPPORTED_GET
 --- METER_SUPPORTED_REPORT
 - CommandClass: COMMAND_CLASS_CENTRAL_SCENE
 -- Version: 3
 -- Commands:
 --- CENTRAL_SCENE_SUPPORTED_GET
 --- CENTRAL_SCENE_SUPPORTED_REPORT
 --- CENTRAL_SCENE_NOTIFICATION
 --- CENTRAL_SCENE_CONFIGURATION_SET
 --- CENTRAL_SCENE_CONFIGURATION_GET
 --- CENTRAL_SCENE_CONFIGURATION_REPORT
 - CommandClass: COMMAND_CLASS_BASIC
 -- Version: 2
 -- Commands:
 --- BASIC_GET
 --- BASIC_REPORT
 --- BASIC_SET
 ------------------------------------------
*/
