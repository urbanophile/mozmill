# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import httplib
import mozinfo
import platform
import sys
import urllib
import urlparse
import datetime

try:
  import json
except:
  import simplejson as json

from handlers import HandlerMatchException

class Report(object):

  def __init__(self, report, date_format="%Y-%m-%dT%H:%M:%SZ"):
    if not isinstance(report, basestring):
      raise HandlerMatchException
    self.report = report
    self.date_format = date_format

  def events(self):
    """returns a mapping of event types (strings) to methods"""
    return {}

  @classmethod
  def add_options(cls, parser):
    """add options to the parser"""
    parser.add_option("--report", dest="report",
                      default=None, metavar='URL',
                      help="Report the results. Requires url to results server. Use 'stdout' for stdout.")

  def stop(self, results, fatal=False):
    results = self.get_report(results)
    return self.send_report(results, self.report)

  def get_report(self, results):
    """get the report results"""

    report = {'report_type': 'mozmill-test',
              'mozmill_version': results.mozmill_version,
              'time_start': results.starttime.strftime(self.date_format),
              'time_end': results.endtime.strftime(self.date_format),
              'time_upload': 'n/a',
              'tests_passed': len(results.passes),
              'tests_failed': len(results.fails),
              'tests_skipped': len(results.skipped),
              'results': results.alltests,
              'screenshots': results.screenshots,
              }

    report.update(results.appinfo)
    report['system_info'] = {"bits": str(mozinfo.bits),
                             "hostname": platform.node(),
                             "processor": mozinfo.processor,
                             "service_pack": getattr(mozinfo, 'service_pack', ''),
                             "system": mozinfo.os.title(),
                             "version": mozinfo.version
                             }
    
    return report

  def send_report(self, results, report_url):
    """ Send a report of the results to a CouchdB instance or a file. """

    # report to file or stdout
    f = None
    if report_url == 'stdout': # stdout
        f = sys.stdout
    if report_url.startswith('file://'):
        filename = report_url.split('file://', 1)[1]
        try:
            f = file(filename, 'w')
        except Exception, e:
            print "Printing results to '%s' failed (%s)." % (filename, e)
            return
    if f:
        print >> f, json.dumps(results)
        return

    # report to CouchDB
    try:
        # Set the upload time of the report
        now = datetime.datetime.utcnow()
        results['time_upload'] = now.strftime(self.date_format)

        # Parse URL fragments and send data
        url_fragments = urlparse.urlparse(report_url)
        connection = httplib.HTTPConnection(url_fragments.netloc)
        connection.request("POST", url_fragments.path, json.dumps(results),
                           {"Content-type": "application/json"})
        
        # Get response which contains the id of the new document
        response = connection.getresponse()
        data = json.loads(response.read())
        connection.close()

        # Check if the report has been created
        if not 'ok' in data:
            raise Exception(data['reason'])

        # Print document location to the console and return
        print "Report document created at '%s/%s'" % (report_url, data['id'])
        return data
    except Exception, e:
        print "Sending results to '%s' failed (%s)." % (report_url, e)
    
