const convert = require('xml-js');
const fs = require('fs');
const dptRegExp = new RegExp('DPS?T\\-(\\d+)(\\-(\\d+))?');

exports.parse = function (knxGadFile, logger) {
    var addresses = {};
    try {
        var data = fs.readFileSync(knxGadFile);
        var ets = convert.xml2js(data);
        if (ets.elements.length > 0) {
            var mains = ets.elements[0].elements;
            for (var i = 0; i < mains.length; i++) {
                if (mains[i].type === 'element') {
                    var middles = mains[i].elements;
                    if (middles === undefined) {
                        continue;
                    }
                    for (var j = 0; j < middles.length; j++) {
                        var subs = middles[j].elements;
                        if (subs === undefined) {
                            continue;
                        }
                        for (var k = 0; k < subs.length; k++) {
                            var dpt = undefined;
                            if (subs[k].attributes.DPTs !== undefined) {
                                var match = dptRegExp.exec(subs[k].attributes.DPTs);
                                if (match === undefined || match == null) {
                                    logger.warn("Unrecognized datapoint %s", subs[k].attributes.DPTs);
                                } else {
                                    var v1 = match[1];
                                    var v2 = match[3];
                                    if(v1 == 3)
                                    {
                                        // JN: dimming, blinds: replace with 5.010 (unsigned 1 byte)
                                        // otherwise we cannot read it (stringify generates "[Object]")
                                        v1 = "5";
                                        v2 = "10";
                                    }
                                    dpt = 'DPT' + v1 + (v2 !== undefined ? '.' + v2.padStart(3,0) : '');
                                }
                            }
                            addresses[subs[k].attributes.Address] = {
                                "name" : subs[k].attributes.Name,
                                "dpt" : dpt,
                                "main" : mains[i].attributes.Name,
                                "middle" : middles[j].attributes.Name
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        logger.warn('Could not read ETS export file %s, %s', knxGadFile, err);
    }
    return addresses;
}
