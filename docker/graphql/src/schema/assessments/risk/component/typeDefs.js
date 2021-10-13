import gql from 'graphql-tag' ;

const typeDefs = gql`
  # declares the query entry-points for this type
  extend type Query {
    component(id: ID!): Component
    componentList( 
        first: Int
        offset: Int
        orderedBy: ComponentsOrdering
        orderMode: OrderingMode
        filters: [ComponentsFiltering]
        filterMode: FilterMode
        search: String
      ): ComponentConnection
    hardwareComponent(id: ID!): HardwareComponent
    hardwareComponentList( 
      first: Int
      offset: Int
      orderedBy: HardwareComponentsOrdering
      orderMode: OrderingMode
      filters: [HardwareComponentsFiltering]
      filterMode: FilterMode
      search: String
    ): HardwareComponentConnection
    networkComponent(id: ID!): NetworkComponent
    networkComponentList( 
      first: Int
      offset: Int
      orderedBy: NetworkComponentsOrdering
      orderMode: OrderingMode
      filters: [NetworkComponentsFiltering]
      filterMode: FilterMode
      search: String
    ): NetworkComponentConnection
    serviceComponent(id: ID!): ServiceComponent
    serviceComponentList( 
      first: Int
      offset: Int
      orderedBy: ServiceComponentsOrdering
      orderMode: OrderingMode
      filters: [ServiceComponentsFiltering]
      filterMode: FilterMode
      search: String
    ): ServiceComponentConnection
    softwareComponent(id: ID!): SoftwareComponent
    softwareComponentList( 
      first: Int
      offset: Int
      orderedBy: SoftwareComponentsOrdering
      orderMode: OrderingMode
      filters: [SoftwareComponentsFiltering]
      filterMode: FilterMode
      search: String
    ): SoftwareComponentConnection
    systemComponent(id: ID!): SystemComponent
    systemComponentList( 
      first: Int
      offset: Int
      orderedBy: SystemComponentsOrdering
      orderMode: OrderingMode
      filters: [SystemComponentsFiltering]
      filterMode: FilterMode
      search: String
    ): SystemComponentConnection
  }

  # declares the mutation entry-points for this type
  extend type Mutation {
    createComponent(input: ComponentAddInput): Component
    deleteComponent(id: ID!): String!
    editComponent(id: ID!, input: [EditInput]!, commitMessage: String): Component
    createHardwareComponent( input: HardwareComponentAddInput ): HardwareComponent
    deleteHardwareComponent( id: ID! ): String!
    editHardwareComponent(id: ID!, input: [EditInput]!, commitMessage: String): HardwareComponent
    createNetworkComponent( input: NetworkComponentAddInput ): NetworkComponent
    deleteNetworkComponent( id: ID! ): String!
    editNetworkComponent(id: ID!, input: [EditInput]!, commitMessage: String): NetworkComponent
    createServiceComponent( input: HardwareComponentAddInput ): ServiceComponent
    deleteServiceComponent( id: ID! ): String!
    editServiceComponent(id: ID!, input: [EditInput]!, commitMessage: String): ServiceComponent
    createSoftwareComponent( input: SoftwareComponentAddInput ): SoftwareComponent
    deleteSoftwareComponent( id: ID! ): String!
    editSoftwareComponent(id: ID!, input: [EditInput]!, commitMessage: String): SoftwareComponent
    createSystemComponent( input: SystemComponentAddInput ): SystemComponent
    deleteSystemComponent( id: ID! ): String!
    editSystemComponent(id: ID!, input: [EditInput]!, commitMessage: String): SystemComponent
}

#####  Component 
##
  "Defines identifying information about an OSCAL component"
  interface Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
  }

  input ComponentAddInput {
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
  }

  # Pagination Types
    type ComponentConnection {
    pageInfo: PageInfo!
    edges: [ComponentEdge]
  }
  type ComponentEdge {
    cursor: String!
    node: Component!
  }
  # Filtering Types
  input ComponentsFiltering {
    key: ComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }
  enum ComponentsOrdering {
    component_type
    asset_type
    created
    modified
    labels
  }
  enum ComponentsFilter {
    component_type
    asset_type
    created
    modified
    labels
  }

#####   Hardware Component 
##
  "Defines identifying information about an OSCAL hardware component"
  type HardwareComponent implements BasicObject & LifecycleObject & CoreObject & OscalObject & Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # Hardware
    "Identifies the CPE identifier for a hardware device"
    cpe_identifier: String
    "Identifies the identifier for the installation"
    installation_id: String
  }

  input HardwareComponentAddInput {
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO: Need to model OSCAL Link with @rel value != reference as Relationships
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # Hardware
    "Identifies the CPE identifier for a hardware device"
    cpe_identifier: String
    "Identifies the identifier for the installation"
    installation_id: String
  }

  # Pagination Types
  type HardwareComponentConnection {
    pageInfo: PageInfo!
    edges: [HardwareComponentEdge]
  }

  type HardwareComponentEdge {
    cursor: String!
    node: HardwareComponent!
  }

  # Filtering Types
  input HardwareComponentsFiltering {
    key: HardwareComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }

  enum HardwareComponentsOrdering {
    component_type
    asset_type
    created
    modified
    labels
  }

  enum HardwareComponentsFilter {
    component_type
    asset_type
    created
    modified
    labels
  }


#####   Network Component 
##
  type NetworkComponent implements BasicObject & LifecycleObject & CoreObject & OscalObject & Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    # NetworkComponent
    "Indicates the name assigned to the network"
    network_name: String!
    "Indicate the IP address range of the network"
    network_address_range: IpAddressRange
  }

  input NetworkComponentAddInput {
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    # NetworkComponent
    "Indicates the name assigned to the network"
    network_name: String!
    "Indicates the IPv4 address range of the network"
    network_ipv4_address_range: IpV4AddressRangeAddInput
    "Indicates the IPv6 address range of the network"
    network_ipv6_address_range: IpV6AddressRangeAddInput
  }

  # Pagination Types
  type NetworkComponentConnection {
    pageInfo: PageInfo!
    edges: [NetworkComponentEdge]
  }

  type NetworkComponentEdge {
    cursor: String!
    node: NetworkComponent!
  }

  # Filtering Types
  input NetworkComponentsFiltering {
    key: NetworkComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }

  enum NetworkComponentsOrdering {
    component_type
    asset_type
    created
    modified
    labels
    network_name
    network_id
  }

  enum NetworkComponentsFilter {
    component_type
    asset_type
    created
    modified
    labels
    network_name
    network_id
  }

#####   Service Component 
##
"Defines identifying information about a Service Component"
  type ServiceComponent implements BasicObject & LifecycleObject & CoreObject & OscalObject & Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # ServiceComponent
    "Identifies information about the protocol used to provide a service."
    ports: [PortInfo!]!
  }

  input ServiceComponentAddInput {
    labels: [String]
    # OscalObject
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # ServiceComponent
    "Identifies information about the protocol used to provide a service."
    ports: [PortInfoAddInput!]!
  }

  # Pagination Types
  type ServiceComponentConnection {
    pageInfo: PageInfo!
    edges: [ServiceComponentEdge]
  }

  type ServiceComponentEdge {
    cursor: String!
    node: ServiceComponent!
  }

  # Filtering Types
  input ServiceComponentsFiltering {
    key: ServiceComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }

  enum ServiceComponentsOrdering {
    component_type
    asset_type
    created
    modified
    labels
  }

  enum ServiceComponentsFilter {
    component_type
    asset_type
    created
    modified
    labels
  }


#####   Software Component 
##
  "Defines identifying information about a Software Component"
  type SoftwareComponent implements BasicObject & LifecycleObject & CoreObject & OscalObject & Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # SoftwareComponent
    cpe_identifier: String
    "Identifies the Software Identifier (SwID)"
    software_identifier: String
    "Identifies the patch level"
    patch_level: String
    "Identifies the identifier for the installation"
    installation_id: String
    "Identifies the license key"
    license_key: String
  }

  input SoftwareComponentAddInput {
    labels: [String]
    # OscalObject
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # SoftwareComponent
    "Identifies the CPE identifier"
    cpe_identifier: String
    "Identifies the Software Identifier (SwID)"
    software_identifier: String
    "Identifies the patch level"
    patch_level: String
    "Identifies the identifier for the installation"
    installation_id: String
    "Identifies the license key"
    license_key: String
  }

  # Pagination Types
  type SoftwareComponentConnection {
    pageInfo: PageInfo!
    edges: [SoftwareComponentEdge]
  }

  type SoftwareComponentEdge {
    cursor: String!
    node: SoftwareComponent!
  }

  # Filtering Types
  input SoftwareComponentsFiltering {
    key: SoftwareComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }

  enum SoftwareComponentsOrdering {
    component_type
    asset_type
    created
    modified
    labels
  }

  enum SoftwareComponentsFilter {
    component_type
    asset_type
    created
    modified
    labels
  }


#####   System Component 
##
"Defines identifying information about a System Component"
  type SystemComponent implements BasicObject & LifecycleObject & CoreObject & OscalObject & Component {
    # BasicObject
    "Uniquely identifies this object."
    id: ID!
    "Identifies the identifier defined by the standard."
    standard_id: String!
    "Identifies the type of the Object."
    entity_type: String!
    "Identifies the parent types of this object."
    parent_types: [String]!
    # CoreObject
    "Indicates the date and time at which the object was originally created."
    created: DateTime!
    "Indicates the date and time that this particular version of the object was last modified."
    modified: DateTime!
    "Identifies a set of terms used to describe this object. The terms are user-defined or trust-group defined."
    labels: [String]
    # OscalObject
    "Identifies a list of CyioExternalReferences, each of which refers to information external to the data model. This property is used to provide one or more URLs, descriptions, or IDs to records in other systems."
    external_references( first: Int ): CyioExternalReferenceConnection
    "Identifies one or more references to additional commentary on the Model."
    notes( first: Int ): CyioNoteConnection
    "Identifies one or more relationships to other entities."
    relationships(
      first: Int
      offset: Int
      orderedBy: OscalRelationshipsOrdering
      orderMode: OrderingMode
      filters: [OscalRelationshipsFiltering]
      filterMode: FilterMode
      search: String 
    ): OscalRelationshipConnection
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    "Indicates references to one or more roles with responsibility for performing a function relative to the containing object."
    responsible_roles: [OscalResponsibleParty]
    "Indicates the physical location of the asset's hardware (e.g., Data Center ID, Cage#, Rack#, or other meaningful location identifiers)."
    physical_location: [OscalLocation]
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # SystemComponent
  }

  input SystemComponentAddInput {
    labels: [String]
    # OscalObject
    # Component
    "Indicates the type of the component"
    component_type: ComponentType!
    "Identifies a human-readable name for the component"
    name: String!
    "Identifies a description of the component, including information about its function."
    description: String!
    "Identifies a summary of the technological or business purpose of the component."
    purpose: String
    "Identifies an organizationally specific identifier that is used to uniquely identify a logical or tangible item by the organization that owns the item."
    asset_id: String
    "Identifies an asset tag assigned by the organization responsible for maintaining the logical or tangible item."
    asset_tag: String
    "Indicates the asset's function, such as Router, Storage Array, DNS Server."
    asset_type: AssetType!
    "Identifies the  model of the component."
    model: String
    "Identifies the name of the company or organization"
    vendor_name: String
    "Indicates the version of the component."
    version: String
    "Identifies date the component was released, such as a software release date or policy publication date."
    release_date: DateTime
    "Indicates relative placement of component ('internal' or 'external') to the system."
    implementation_point: ImplementationPoint!
    "Identifies whether the asset can be check with an authenticated scan"
    allows_authenticated_scans: Boolean
    "Identifies whether the asset is publicly accessible"
    is_publicly_accessible: Boolean
    "Identifies whether the asset is virtualized"
    is_virtual: Boolean
    "Identifies the network identifier of the asset."
    network_id: String
    "Identifies the Virtual LAN identifier of the asset."
    vlan_id: String
    "Identifies The name of the baseline configuration for the asset."
    baseline_configuration_name: String
    "Identifies the function provided by the asset for the system."
    function: String
    "Indicates the operational status of the system component."
    operational_status: OperationalStatus!
    # TODO:  These SHOULD be references to the entities, not just their UUID/identifier
    # "Identifies the related leveraged-authorization assembly in this SSP."
    # leveraged_authorization: String
    # "Identifies the component as it was assigned in the leveraged system's SSP."
    # inherited_identifier: String
    #
    # SystemComponent
  }

  # Pagination Types
  type SystemComponentConnection {
    pageInfo: PageInfo!
    edges: [SystemComponentEdge]
  }

  type SystemComponentEdge {
    cursor: String!
    node: SystemComponent!
  }

  # Filtering Types
  input SystemComponentsFiltering {
    key: SystemComponentsFilter!
    values: [String]!
    operator: String
    filterMode: FilterMode
  }

  enum SystemComponentsOrdering {
    component_type
    created
    modified
    labels
  }

  enum SystemComponentsFilter {
    component_type
    created
    modified
    labels
  }

  union ComponentTypes = HardwareComponent | NetworkComponent | ServiceComponent | SoftwareComponent | SystemComponent

  "Defines the types of components"
  enum ComponentType {
    "Any guideline or recommendation."
    guidance
    "A physical device."
    hardware
    "A connection to something outside this system."
    interconnection
    "A physical or virtual network."
    network
    "A tangible asset used to provide physical protections or countermeasures."
    physical
    "An applicable plan."
    plan
    "An enforceable policy."
    policy
    "A list of steps or actions to take to achieve some end result."
    process_procedure
    " A service that may provide APIs."
    service
    "Any software, operating system, or firmware."
    software
    "Any organizational or industry standard."
    standard
    "An external system, which may be a leveraged system or the other side of an interconnection."
    system
    "The system as a whole."
    this_system
    "An external assessment performed on some other component, that has been validated by a third-party."
    validation
  }

`;

export default typeDefs ;
