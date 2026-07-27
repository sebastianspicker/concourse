# Private connector stubs

These modules define inactive extension boundaries. The public BFF does not
import them and they do not call protected systems.

ASIMUT and ILIAS stubs return tagged stub results. The StudiService status stub
is tagged, while its room result is an empty array. A private implementation
must define an explicit unavailable or unimplemented state instead of relying
on an empty collection.

Protected connector implementations, credentials, private endpoints, and real
user data belong in a separately reviewed private codebase.
