"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, CheckCircle, FileSpreadsheet, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface JudgementOption {
  score: number
  label: string
}

interface SkillGroup {
  id: string
  number: number
  name: string
  nameEn: string | null
  maxScore: number
}

interface Criterion {
  id: string
  type: "M" | "J"
  description: string
  verificationMethod: string | null
  maxScore: number
  judgementOptions: JudgementOption[]
  skillGroup?: SkillGroup | null
  order: number
}

interface SubCriterion {
  id: string
  code: string
  name: string
  order: number
  criteria: Criterion[]
}

interface Module {
  id: string
  code: string
  name: string
  nameEn: string | null
  maxScore: number
  order: number
  subCriteria: SubCriterion[]
}

interface Schema {
  id: string
  name: string
  totalMaxScore: number
  modules: Module[]
  skillGroups: SkillGroup[]
}

export default function SchemaUploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { t, locale } = useI18n()
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [schema, setSchema] = useState<Schema | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())

  // Modal states
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [showCriterionModal, setShowCriterionModal] = useState(false)
  const [showSkillGroupModal, setShowSkillGroupModal] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingSub, setEditingSub] = useState<SubCriterion | null>(null)
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [editingSkillGroup, setEditingSkillGroup] = useState<SkillGroup | null>(null)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [currentSubId, setCurrentSubId] = useState<string | null>(null)

  // Form states
  const [moduleForm, setModuleForm] = useState({ code: "", name: "", nameEn: "" })
  const [subForm, setSubForm] = useState({ code: "", name: "" })
  const [criterionForm, setCriterionForm] = useState({
    type: "M" as "M" | "J",
    description: "",
    verificationMethod: "",
    maxScore: 1,
    skillGroupNumber: 0,
    judgementOptions: [] as JudgementOption[],
  })
  const [skillGroupForm, setSkillGroupForm] = useState({ name: "", nameEn: "" })

  useEffect(() => {
    fetchSchema()
  }, [eventId])

  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/schema`)
      if (response.ok) {
        const data = await response.json()
        if (data.id) {
          setSchema(data)
        }
      }
    } catch (error) {
      console.error("Error fetching schema:", error)
    }
  }

  const getSkillGroupCriteria = (skillGroupNumber: number) => {
    if (!schema) return []

    return schema.modules.flatMap((module) =>
      module.subCriteria.flatMap((sub) =>
        sub.criteria
          .filter((criterion) => criterion.skillGroup?.number === skillGroupNumber)
          .map((criterion) => ({
            moduleCode: module.code,
            subCode: sub.code,
            criterion,
          }))
      )
    )
  }

  const openEditSkillGroup = (skillGroup: SkillGroup) => {
    setEditingSkillGroup(skillGroup)
    setSkillGroupForm({ name: skillGroup.name, nameEn: skillGroup.nameEn || "" })
    setShowSkillGroupModal(true)
  }

  const saveSkillGroup = async () => {
    if (!editingSkillGroup) return

    try {
      await fetch(`/api/events/${eventId}/schema/skill-groups/${editingSkillGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skillGroupForm),
      })
      setShowSkillGroupModal(false)
      setEditingSkillGroup(null)
      fetchSchema()
    } catch (error) {
      console.error("Error saving skill group:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/events/${eventId}/schema`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Схема загружена! Модулей: ${data.modulesCount}, Критериев: ${data.criteriaCount}`,
        })
        fetchSchema()
      } else {
        setResult({
          success: false,
          message: data.error || "Ошибка загрузки",
        })
      }
    } catch {
      setResult({
        success: false,
        message: "Ошибка загрузки",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Module CRUD
  const openAddModule = () => {
    setEditingModule(null)
    setModuleForm({ code: "", name: "", nameEn: "" })
    setShowModuleModal(true)
  }

  const openEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleForm({ code: module.code, name: module.name, nameEn: module.nameEn || "" })
    setShowModuleModal(true)
  }

  const saveModule = async () => {
    try {
      if (editingModule) {
        await fetch(`/api/events/${eventId}/schema/modules/${editingModule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(moduleForm),
        })
      } else {
        await fetch(`/api/events/${eventId}/schema/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(moduleForm),
        })
      }
      setShowModuleModal(false)
      fetchSchema()
    } catch (error) {
      console.error("Error saving module:", error)
    }
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm(locale === "ru" ? "Удалить модуль и все его критерии?" : "Delete module and all its criteria?")) return
    try {
      await fetch(`/api/events/${eventId}/schema/modules/${moduleId}`, { method: "DELETE" })
      fetchSchema()
    } catch (error) {
      console.error("Error deleting module:", error)
    }
  }

  // Sub-criterion CRUD
  const openAddSub = (moduleId: string) => {
    setCurrentModuleId(moduleId)
    setEditingSub(null)
    setSubForm({ code: "", name: "" })
    setShowSubModal(true)
  }

  const openEditSub = (sub: SubCriterion) => {
    setEditingSub(sub)
    setSubForm({ code: sub.code, name: sub.name })
    setShowSubModal(true)
  }

  const saveSub = async () => {
    try {
      if (editingSub) {
        await fetch(`/api/events/${eventId}/schema/subcriteria/${editingSub.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subForm),
        })
      } else if (currentModuleId) {
        await fetch(`/api/events/${eventId}/schema/modules/${currentModuleId}/subcriteria`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subForm),
        })
      }
      setShowSubModal(false)
      fetchSchema()
    } catch (error) {
      console.error("Error saving sub-criterion:", error)
    }
  }

  const deleteSub = async (subId: string) => {
    if (!confirm(locale === "ru" ? "Удалить подкритерий и все его критерии?" : "Delete sub-criterion and all its criteria?")) return
    try {
      await fetch(`/api/events/${eventId}/schema/subcriteria/${subId}`, { method: "DELETE" })
      fetchSchema()
    } catch (error) {
      console.error("Error deleting sub-criterion:", error)
    }
  }

  // Criterion CRUD
  const openAddCriterion = (subId: string) => {
    setCurrentSubId(subId)
    setEditingCriterion(null)
    setCriterionForm({
      type: "M",
      description: "",
      verificationMethod: "",
      maxScore: 1,
      skillGroupNumber: 0,
      judgementOptions: [],
    })
    setShowCriterionModal(true)
  }

  const openEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion)
    setCriterionForm({
      type: criterion.type,
      description: criterion.description,
      verificationMethod: criterion.verificationMethod || "",
      maxScore: criterion.maxScore,
      skillGroupNumber: criterion.skillGroup?.number || 0,
      judgementOptions: criterion.judgementOptions || [],
    })
    setShowCriterionModal(true)
  }

  const saveCriterion = async () => {
    try {
      const data = {
        ...criterionForm,
        skillGroupNumber: criterionForm.skillGroupNumber || undefined,
      }
      if (editingCriterion) {
        await fetch(`/api/events/${eventId}/schema/criteria/${editingCriterion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else if (currentSubId) {
        await fetch(`/api/events/${eventId}/schema/subcriteria/${currentSubId}/criteria`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      setShowCriterionModal(false)
      fetchSchema()
    } catch (error) {
      console.error("Error saving criterion:", error)
    }
  }

  const deleteCriterion = async (criterionId: string) => {
    if (!confirm(locale === "ru" ? "Удалить критерий?" : "Delete criterion?")) return
    try {
      await fetch(`/api/events/${eventId}/schema/criteria/${criterionId}`, { method: "DELETE" })
      fetchSchema()
    } catch (error) {
      console.error("Error deleting criterion:", error)
    }
  }

  const toggleModule = (id: string) => {
    const newSet = new Set(expandedModules)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedModules(newSet)
  }

  const toggleSub = (id: string) => {
    const newSet = new Set(expandedSubs)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedSubs(newSet)
  }

  const addJudgementOption = () => {
    setCriterionForm({
      ...criterionForm,
      judgementOptions: [...criterionForm.judgementOptions, { score: 0, label: "" }],
    })
  }

  const updateJudgementOption = (index: number, field: "score" | "label", value: string | number) => {
    const newOptions = [...criterionForm.judgementOptions]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setCriterionForm({ ...criterionForm, judgementOptions: newOptions })
  }

  const removeJudgementOption = (index: number) => {
    setCriterionForm({
      ...criterionForm,
      judgementOptions: criterionForm.judgementOptions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Link href={`/admin/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === "ru" ? "Схема оценки" : "Assessment Schema"}
            </h1>
            <p className="text-gray-500">
              {locale === "ru" ? "Загрузите Excel или создайте критерии вручную" : "Upload Excel or create criteria manually"}
            </p>
          </div>
        </div>
        {schema && (
          <Button onClick={openAddModule} className="w-full bg-[#C41E3A] hover:bg-[#a01830] sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {locale === "ru" ? "Добавить модуль" : "Add Module"}
          </Button>
        )}
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "ru" ? "Загрузка из Excel" : "Upload from Excel"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-3 text-sm">
              {locale === "ru" ? "Загрузите файл Excel со схемой оценки" : "Upload Excel file with assessment schema"}
            </p>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
              <span className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {locale === "ru" ? "Выбрать файл" : "Select file"}
              </span>
            </label>
          </div>

          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {result.success && <CheckCircle className="h-4 w-4 inline mr-2" />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual creation hint */}
      {!schema && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">
              {locale === "ru"
                ? "Или создайте схему вручную, добавив первый модуль"
                : "Or create schema manually by adding the first module"}
            </p>
            <Button onClick={openAddModule} className="bg-[#C41E3A] hover:bg-[#a01830]">
              <Plus className="h-4 w-4 mr-2" />
              {locale === "ru" ? "Создать схему вручную" : "Create Schema Manually"}
            </Button>
          </CardContent>
        </Card>
      )}

      {schema && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{locale === "ru" ? "Матрица навыков (WSSS)" : "Skill Matrix (WSSS)"}</CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  {locale === "ru"
                    ? "Аспекты импортируются из Excel. Здесь их можно проверить и скорректировать до генерации дипломов."
                    : "Aspects are imported from Excel. Review and correct them before diploma generation."}
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {schema.skillGroups.length} WSSS
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="py-2 pr-3 font-medium">WSSS</th>
                    <th className="py-2 pr-3 font-medium">{locale === "ru" ? "Название" : "Name"}</th>
                    <th className="py-2 pr-3 font-medium">{locale === "ru" ? "Название EN" : "Name RU/EN"}</th>
                    <th className="py-2 pr-3 font-medium">{locale === "ru" ? "Критерии" : "Criteria"}</th>
                    <th className="py-2 pr-3 font-medium">{locale === "ru" ? "Баллы" : "Points"}</th>
                    <th className="py-2 pr-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {schema.skillGroups.map((skillGroup) => {
                    const linkedCriteria = getSkillGroupCriteria(skillGroup.number)

                    return (
                      <tr key={skillGroup.id} className="border-b last:border-0">
                        <td className="py-3 pr-3 align-top font-mono text-gray-700">{skillGroup.number}</td>
                        <td className="py-3 pr-3 align-top text-gray-900">{skillGroup.name}</td>
                        <td className="py-3 pr-3 align-top text-gray-600">{skillGroup.nameEn || "—"}</td>
                        <td className="py-3 pr-3 align-top">
                          <div className="space-y-1">
                            <span className="font-medium text-gray-700">{linkedCriteria.length}</span>
                            {linkedCriteria.length > 0 && (
                              <div className="flex max-w-md flex-wrap gap-1">
                                {linkedCriteria.slice(0, 8).map(({ moduleCode, subCode, criterion }) => (
                                  <span key={criterion.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                    {moduleCode}.{subCode}
                                  </span>
                                ))}
                                {linkedCriteria.length > 8 && (
                                  <span className="text-xs text-gray-500">+{linkedCriteria.length - 8}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top text-gray-700">{skillGroup.maxScore}</td>
                        <td className="py-3 pr-3 align-top text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditSkillGroup(skillGroup)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema View */}
      {schema && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{schema.name}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full">
                  {locale === "ru" ? "Модулей" : "Modules"}: {schema.modules.length}
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  {locale === "ru" ? "Макс. балл" : "Max score"}: {schema.totalMaxScore}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {schema.modules.map((module) => (
              <div key={module.id} className="border rounded-lg">
                {/* Module header */}
                <div
                  className="flex flex-col gap-3 bg-gray-50 p-3 hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-start gap-2">
                    {expandedModules.has(module.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{module.code}: {module.name}</span>
                        <span className="text-sm text-gray-500">({module.maxScore} {locale === "ru" ? "баллов" : "pts"})</span>
                      </div>
                      {module.nameEn && <p className="text-xs text-gray-500">{module.nameEn}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openEditModule(module)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteModule(module.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Module content */}
                {expandedModules.has(module.id) && (
                  <div className="p-3 space-y-2">
                    <Button variant="outline" size="sm" onClick={() => openAddSub(module.id)}>
                      <Plus className="h-3 w-3 mr-1" />
                      {locale === "ru" ? "Добавить подкритерий" : "Add Sub-criterion"}
                    </Button>

                    {module.subCriteria.map((sub) => (
                      <div key={sub.id} className="border-l-2 border-gray-200 ml-4 pl-3">
                        {/* Sub-criterion header */}
                        <div
                          className="flex flex-col gap-2 py-2 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                          onClick={() => toggleSub(sub.id)}
                        >
                          <div className="flex items-start gap-2">
                            {expandedSubs.has(sub.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="font-medium text-sm">{sub.code}. {sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openEditSub(sub)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteSub(sub.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Criteria */}
                        {expandedSubs.has(sub.id) && (
                          <div className="ml-4 space-y-1 pb-2">
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => openAddCriterion(sub.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              {locale === "ru" ? "Добавить критерий" : "Add Criterion"}
                            </Button>

                            {sub.criteria.map((crit) => (
                              <div key={crit.id} className="flex flex-col gap-2 rounded bg-gray-50 p-2 text-sm sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${crit.type === "M" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                                      {crit.type}
                                    </span>
                                    <span className="text-gray-600">{crit.maxScore} {locale === "ru" ? "б." : "pts"}</span>
                                    {crit.skillGroup && (
                                      <span className="text-xs text-gray-400">
                                        WSSS {crit.skillGroup.number}: {locale === "en" ? crit.skillGroup.nameEn || crit.skillGroup.name : crit.skillGroup.name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-700 mt-1">{crit.description}</p>
                                  {crit.verificationMethod && (
                                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                                      {crit.verificationMethod}
                                    </p>
                                  )}
                                  {crit.type === "J" && crit.judgementOptions.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {crit.judgementOptions.map((opt, i) => (
                                        <span key={i} className="text-xs bg-gray-200 px-1 rounded">
                                          {opt.score}: {opt.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button variant="ghost" size="sm" onClick={() => openEditCriterion(crit)}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteCriterion(crit.id)}>
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Group Modal */}
      {showSkillGroupModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="modal-panel w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">
              {locale === "ru" ? "Редактировать аспект матрицы навыков" : "Edit Skill Matrix Aspect"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">WSSS</label>
                <Input value={editingSkillGroup?.number ?? ""} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Название" : "Name"}</label>
                <Input value={skillGroupForm.name} onChange={(e) => setSkillGroupForm({ ...skillGroupForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Название (EN)" : "Name (EN)"}</label>
                <Input value={skillGroupForm.nameEn} onChange={(e) => setSkillGroupForm({ ...skillGroupForm, nameEn: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowSkillGroupModal(false)}>{locale === "ru" ? "Отмена" : "Cancel"}</Button>
              <Button onClick={saveSkillGroup} className="bg-[#C41E3A] hover:bg-[#a01830]">{locale === "ru" ? "Сохранить" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="modal-panel w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingModule ? (locale === "ru" ? "Редактировать модуль" : "Edit Module") : (locale === "ru" ? "Новый модуль" : "New Module")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Код (A, B, C...)" : "Code (A, B, C...)"}</label>
                <Input value={moduleForm.code} onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Название" : "Name"}</label>
                <Input value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Название (EN)" : "Name (EN)"}</label>
                <Input value={moduleForm.nameEn} onChange={(e) => setModuleForm({ ...moduleForm, nameEn: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowModuleModal(false)}>{locale === "ru" ? "Отмена" : "Cancel"}</Button>
              <Button onClick={saveModule} className="bg-[#C41E3A] hover:bg-[#a01830]">{locale === "ru" ? "Сохранить" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-criterion Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="modal-panel w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingSub ? (locale === "ru" ? "Редактировать подкритерий" : "Edit Sub-criterion") : (locale === "ru" ? "Новый подкритерий" : "New Sub-criterion")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Код (1, 2, 3...)" : "Code (1, 2, 3...)"}</label>
                <Input value={subForm.code} onChange={(e) => setSubForm({ ...subForm, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Название" : "Name"}</label>
                <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowSubModal(false)}>{locale === "ru" ? "Отмена" : "Cancel"}</Button>
              <Button onClick={saveSub} className="bg-[#C41E3A] hover:bg-[#a01830]">{locale === "ru" ? "Сохранить" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Criterion Modal */}
      {showCriterionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 backdrop-blur-sm py-8 sm:items-center">
          <div className="modal-panel mx-4 w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCriterion ? (locale === "ru" ? "Редактировать критерий" : "Edit Criterion") : (locale === "ru" ? "Новый критерий" : "New Criterion")}
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Тип" : "Type"}</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={criterionForm.type}
                    onChange={(e) => setCriterionForm({ ...criterionForm, type: e.target.value as "M" | "J" })}
                  >
                    <option value="M">M - {locale === "ru" ? "Измерение (Да/Нет)" : "Measurement (Yes/No)"}</option>
                    <option value="J">J - {locale === "ru" ? "Суждение (Шкала)" : "Judgement (Scale)"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Макс. балл" : "Max Score"}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={criterionForm.maxScore}
                    onChange={(e) => setCriterionForm({ ...criterionForm, maxScore: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Описание" : "Description"}</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  value={criterionForm.description}
                  onChange={(e) => setCriterionForm({ ...criterionForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Метод проверки" : "Verification Method"}</label>
                <Input
                  value={criterionForm.verificationMethod}
                  onChange={(e) => setCriterionForm({ ...criterionForm, verificationMethod: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ru" ? "Группа навыков (WSSS 1-9)" : "Skill Group (WSSS 1-9)"}</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={criterionForm.skillGroupNumber}
                  onChange={(e) => setCriterionForm({ ...criterionForm, skillGroupNumber: parseInt(e.target.value) || 0 })}
                >
                  <option value={0}>{locale === "ru" ? "Не выбрано" : "Not selected"}</option>
                  {schema?.skillGroups.map((sg) => (
                    <option key={sg.id} value={sg.number}>
                      {sg.number}. {locale === "ru" ? sg.name : sg.nameEn || sg.name}
                    </option>
                  ))}
                </select>
              </div>

              {criterionForm.type === "J" && (
                <div>
                  <label className="block text-sm font-medium mb-2">{locale === "ru" ? "Варианты оценки" : "Judgement Options"}</label>
                  <div className="space-y-2">
                    {criterionForm.judgementOptions.map((opt, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          type="number"
                          className="w-20"
                          placeholder={locale === "ru" ? "Балл" : "Score"}
                          value={opt.score}
                          onChange={(e) => updateJudgementOption(i, "score", parseFloat(e.target.value) || 0)}
                        />
                        <Input
                          className="flex-1"
                          placeholder={locale === "ru" ? "Описание" : "Label"}
                          value={opt.label}
                          onChange={(e) => updateJudgementOption(i, "label", e.target.value)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeJudgementOption(i)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addJudgementOption}>
                      <Plus className="h-3 w-3 mr-1" />
                      {locale === "ru" ? "Добавить вариант" : "Add Option"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowCriterionModal(false)}>{locale === "ru" ? "Отмена" : "Cancel"}</Button>
              <Button onClick={saveCriterion} className="bg-[#C41E3A] hover:bg-[#a01830]">{locale === "ru" ? "Сохранить" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
